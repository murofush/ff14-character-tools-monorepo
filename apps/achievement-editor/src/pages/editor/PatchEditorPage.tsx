import { JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card'
import { Input } from '../../shared/ui/input'
import {
  loadAllEditorStates,
  loadPatchDefinitions,
  saveAllEditorStatesToBackend,
  savePatchDefinitionsToBackend,
} from '../../features/editor/lib/editorDataSource'
import {
  applyForcedPatchDeletionAcrossEditorStates,
  applyForcedPatchInsertionAcrossEditorStates,
  getLatestPatchDefinitionId,
  sortPatchDefinitionsById,
} from '../../features/editor/lib/forceUpdateDomain'
import { type AchievementEditorState, type PatchDefinitionModel } from '../../features/editor/model/types'
import { useAppSnackbar } from '../../features/snackbar/context/AppSnackbarContext'
import { type SnackbarColor } from '../../features/snackbar/lib/snackbarModel'

/** 目的: パッチ定義配列を安全に複製する。副作用: なし。前提: JSONシリアライズ可能な構造である。 */
function clonePatches(patches: PatchDefinitionModel[]): PatchDefinitionModel[] {
  return JSON.parse(JSON.stringify(patches)) as PatchDefinitionModel[]
}

/** 目的: アチーブメント編集state配列を安全に複製する。副作用: なし。前提: JSONシリアライズ可能な構造である。 */
function cloneEditorStates(states: AchievementEditorState[]): AchievementEditorState[] {
  return JSON.parse(JSON.stringify(states)) as AchievementEditorState[]
}

/** 目的: 旧Vueの `/patch` 責務をReactで提供する。副作用: Cloud Storage読込とsave_text保存を実行する。前提: 認証セッションが有効である。 */
export function PatchEditorPage(): JSX.Element {
  const backendBaseUrl =
    (import.meta.env.VITE_ACHIEVEMENT_BACKEND_BASE_URL as string | undefined) ?? ''
  const cloudStorageBaseUrl =
    (import.meta.env.VITE_ACHIEVEMENT_DATA_BASE_URL as string | undefined) ?? undefined
  const { showSnackbar } = useAppSnackbar()

  const [patches, setPatches] = useState<PatchDefinitionModel[]>([])
  const [basePatches, setBasePatches] = useState<PatchDefinitionModel[]>([])
  const [achievementStates, setAchievementStates] = useState<AchievementEditorState[]>([])
  const [baseAchievementStates, setBaseAchievementStates] = useState<AchievementEditorState[]>([])
  const [isForcePatchUpdate, setIsForcePatchUpdate] = useState<boolean>(false)
  const [patchId, setPatchId] = useState<number>(1)
  const [patchNumber, setPatchNumber] = useState<string>('')
  const [patchSubtitle, setPatchSubtitle] = useState<string>('')
  const [patchDate, setPatchDate] = useState<string>('')
  const [patchTargetVersion, setPatchTargetVersion] = useState<number>(1)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  /** 目的: 共通スナックバーへメッセージを通知する。副作用: 全画面通知レイヤーを表示する。前提: Provider配下で実行される。 */
  const setMessage = useCallback((text: string, color: SnackbarColor = 'primary'): void => {
    showSnackbar({ text, color })
  }, [showSnackbar])

  useEffect(() => {
    let cancelled = false

    /** 目的: パッチ定義と全アチーブメント編集データを初期ロードする。副作用: state更新を行う。前提: Cloud Storageパスが有効である。 */
    const loadData = async (): Promise<void> => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const [loadedPatches, loadedAchievementStates] = await Promise.all([
          loadPatchDefinitions({ cloudStorageBaseUrl }),
          loadAllEditorStates({ cloudStorageBaseUrl }),
        ])
        if (cancelled) {
          return
        }
        const sortedPatches = sortPatchDefinitionsById(loadedPatches)
        setPatches(sortedPatches)
        setBasePatches(clonePatches(sortedPatches))
        setAchievementStates(loadedAchievementStates)
        setBaseAchievementStates(cloneEditorStates(loadedAchievementStates))
        setPatchId(getLatestPatchDefinitionId(sortedPatches) + 1)
      } catch (error) {
        if (cancelled) {
          return
        }
        const reason = error instanceof Error ? error.message : String(error)
        setErrorMessage(`パッチ編集データの取得に失敗しました: ${reason}`)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [cloudStorageBaseUrl])

  const isPatchUpdated = useMemo((): boolean => {
    return JSON.stringify(patches) !== JSON.stringify(basePatches)
  }, [basePatches, patches])

  const isAchievementUpdated = useMemo((): boolean => {
    return JSON.stringify(achievementStates) !== JSON.stringify(baseAchievementStates)
  }, [achievementStates, baseAchievementStates])

  /** 目的: 新規パッチを追加し、必要なら強制ID追従を全アチーブメントへ適用する。副作用: patches/achievementStatesを更新する。前提: patchIdは1以上の整数である。 */
  const handleAddPatch = (): void => {
    if (!Number.isInteger(patchId) || patchId < 1) {
      setMessage('パッチIDは1以上の整数を指定してください。', 'warning')
      return
    }
    const normalizedNumber = patchNumber.trim()
    if (normalizedNumber === '') {
      setMessage('パッチナンバーは必須です。', 'warning')
      return
    }
    if (patchDate.trim() === '') {
      setMessage('パッチ日付は必須です。', 'warning')
      return
    }
    const patchDateAsDate = new Date(patchDate)
    if (Number.isNaN(patchDateAsDate.getTime())) {
      setMessage('パッチ日付の形式が不正です。', 'warning')
      return
    }
    const minimumDate = new Date('2010-09-30')
    if (patchDateAsDate < minimumDate) {
      setMessage('パッチ日付は 2010-09-30 以降を指定してください。', 'warning')
      return
    }
    if (!Number.isInteger(patchTargetVersion) || patchTargetVersion < 1) {
      setMessage('対象バージョンは1以上の整数を指定してください。', 'warning')
      return
    }

    const existingIds = patches.map((patch) => patch.id)
    const existingNumbers = patches.map((patch) =>
      typeof patch.number === 'string' ? patch.number : ''
    )
    if (!isForcePatchUpdate && existingIds.includes(patchId)) {
      setMessage(`パッチID ${patchId} は既に存在します。`, 'warning')
      return
    }
    if (existingNumbers.includes(normalizedNumber)) {
      setMessage(`パッチナンバー「${normalizedNumber}」は既に存在します。`, 'warning')
      return
    }

    let nextPatches = clonePatches(patches)
    let nextAchievementStates = cloneEditorStates(achievementStates)
    if (isForcePatchUpdate) {
      const forcedResult = applyForcedPatchInsertionAcrossEditorStates(
        nextAchievementStates,
        nextPatches,
        patchId
      )
      nextPatches = forcedResult.patches
      nextAchievementStates = forcedResult.states
    }

    const nextPatch: PatchDefinitionModel = {
      id: patchId,
      number: normalizedNumber,
      subtitle: patchSubtitle.trim(),
      date: patchDate,
      targetVersion: patchTargetVersion,
    }
    const mergedPatches = sortPatchDefinitionsById([...nextPatches, nextPatch])
    setPatches(mergedPatches)
    setAchievementStates(nextAchievementStates)
    setPatchId(getLatestPatchDefinitionId(mergedPatches) + 1)
    setPatchNumber('')
    setPatchSubtitle('')
    setPatchDate('')
    setPatchTargetVersion(1)
    setMessage(
      isForcePatchUpdate
        ? 'パッチを追加し、全アチーブメントのadjustmentPatchId参照を強制更新しました。'
        : 'パッチを追加しました。'
    )
  }

  /** 目的: 指定パッチを削除し、必要なら強制ID追従を全アチーブメントへ適用する。副作用: patches/achievementStatesを更新する。前提: patchId は既存パッチIDである。 */
  const handleDeletePatch = (targetPatchId: number): void => {
    if (!patches.some((patch) => patch.id === targetPatchId)) {
      setMessage(`パッチID ${targetPatchId} が見つかりませんでした。`, 'warning')
      return
    }
    const patchesAfterDelete = sortPatchDefinitionsById(
      patches.filter((patch) => patch.id !== targetPatchId)
    )
    let nextPatches = patchesAfterDelete
    let nextAchievementStates = cloneEditorStates(achievementStates)
    if (isForcePatchUpdate) {
      const forcedResult = applyForcedPatchDeletionAcrossEditorStates(
        nextAchievementStates,
        nextPatches,
        targetPatchId
      )
      nextPatches = forcedResult.patches
      nextAchievementStates = forcedResult.states
    }
    setPatches(nextPatches)
    setAchievementStates(nextAchievementStates)
    setPatchId(getLatestPatchDefinitionId(nextPatches) + 1)
    setMessage(
      isForcePatchUpdate
        ? `パッチID ${targetPatchId} を削除し、全アチーブメントのadjustmentPatchId参照を強制更新しました。`
        : `パッチID ${targetPatchId} を削除しました。`
    )
  }

  /** 目的: パッチ定義をsave_textへ保存する。副作用: HTTP POSTを実行し、basePatchesを更新する。前提: 認証セッションが有効である。 */
  const handleSavePatches = async (): Promise<void> => {
    try {
      await savePatchDefinitionsToBackend(patches, {
        backendBaseUrl,
      })
      setBasePatches(clonePatches(patches))
      setMessage('パッチ定義を保存しました。')
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setMessage(`パッチ定義の保存に失敗しました: ${reason}`, 'error')
    }
  }

  /** 目的: 強制更新後の全アチーブメント編集データを保存する。副作用: 複数HTTP POSTを実行し、baseAchievementStatesを更新する。前提: 認証セッションが有効である。 */
  const handleSaveAchievements = async (): Promise<void> => {
    try {
      await saveAllEditorStatesToBackend(achievementStates, {
        backendBaseUrl,
      })
      setBaseAchievementStates(cloneEditorStates(achievementStates))
      setMessage('全アチーブメント編集データを保存しました。')
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setMessage(`アチーブメント保存に失敗しました: ${reason}`, 'error')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patch</CardTitle>
          <CardDescription>パッチ定義とアチーブメント編集データを読み込んでいます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (errorMessage !== '') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patch</CardTitle>
          <CardDescription className="text-[var(--danger)]">{errorMessage}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Patch</CardTitle>
            {isPatchUpdated ? (
              <Badge variant="subtle">パッチ未保存</Badge>
            ) : (
              <Badge variant="subtle">パッチ保存済み</Badge>
            )}
            {isAchievementUpdated ? (
              <Badge variant="subtle">アチーブメント未保存</Badge>
            ) : (
              <Badge variant="subtle">アチーブメント保存済み</Badge>
            )}
          </div>
          <CardDescription>旧 `/patch` の強制ID更新（isForcePatchUpdate）を含む管理画面です。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-5">
            <label className="text-xs text-[var(--ink-subtle)]">
              パッチID
              <Input
                type="number"
                value={patchId}
                onChange={(event) => setPatchId(Number(event.currentTarget.value))}
              />
            </label>
            <label className="text-xs text-[var(--ink-subtle)]">
              パッチナンバー
              <Input value={patchNumber} onChange={(event) => setPatchNumber(event.currentTarget.value)} />
            </label>
            <label className="text-xs text-[var(--ink-subtle)]">
              サブタイトル
              <Input value={patchSubtitle} onChange={(event) => setPatchSubtitle(event.currentTarget.value)} />
            </label>
            <label className="text-xs text-[var(--ink-subtle)]">
              適用日
              <Input type="date" value={patchDate} onChange={(event) => setPatchDate(event.currentTarget.value)} />
            </label>
            <label className="text-xs text-[var(--ink-subtle)]">
              対象バージョン
              <Input
                type="number"
                value={patchTargetVersion}
                onChange={(event) => setPatchTargetVersion(Number(event.currentTarget.value))}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={isForcePatchUpdate}
                onChange={(event) => setIsForcePatchUpdate(event.currentTarget.checked)}
              />
              パッチID強制更新
            </label>
            <Button type="button" onClick={handleAddPatch}>
              追加
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSavePatches()}
              disabled={!isPatchUpdated}
            >
              パッチ保存
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSaveAchievements()}
              disabled={!isAchievementUpdated}
            >
              アチーブメント保存
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">パッチ一覧 ({patches.length})</CardTitle>
          <CardDescription>削除時に強制更新ONなら adjustmentPatchId 参照を追従します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {patches.map((patch) => (
            <div key={patch.id} className="rounded-xl border border-[var(--line)] bg-white px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {patch.id}. {typeof patch.number === 'string' ? patch.number : ''}
                  {typeof patch.subtitle === 'string' && patch.subtitle !== '' ? ` - ${patch.subtitle}` : ''}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleDeletePatch(patch.id)}>
                  削除
                </Button>
              </div>
              <p className="text-xs text-[var(--ink-subtle)]">
                date: {typeof patch.date === 'string' ? patch.date : '-'} / targetVersion:{' '}
                {typeof patch.targetVersion === 'number' ? patch.targetVersion : 0}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
