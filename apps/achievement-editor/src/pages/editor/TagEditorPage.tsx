import { JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card'
import { Input } from '../../shared/ui/input'
import {
  loadAllEditorStates,
  loadTagDefinitions,
  saveAllEditorStatesToBackend,
  saveTagDefinitionsToBackend,
} from '../../features/editor/lib/editorDataSource'
import {
  applyForcedTagDeletionAcrossEditorStates,
  applyForcedTagInsertionAcrossEditorStates,
  getLatestTagDefinitionId,
  sortTagDefinitionsById,
} from '../../features/editor/lib/forceUpdateDomain'
import { type AchievementEditorState, type TagDefinitionModel } from '../../features/editor/model/types'
import {
  addTopLevelTagDefinition,
  deleteTagDefinitionByPathWithPromote,
  indentTagDefinition,
  moveTagDefinitionDown,
  moveTagDefinitionUp,
  outdentTagDefinition,
  type TagPath,
} from '../../features/editor/lib/tagHierarchyDomain'
import { useAppSnackbar } from '../../features/snackbar/context/AppSnackbarContext'
import { type SnackbarColor } from '../../features/snackbar/lib/snackbarModel'

type FlatTagRow = {
  id: number
  name: string
  depth: number
  targetVersion: number
  iconPath: string
  path: TagPath
}

/** 目的: タグ定義配列を安全に複製する。副作用: なし。前提: JSONシリアライズ可能な構造である。 */
function cloneTags(tags: TagDefinitionModel[]): TagDefinitionModel[] {
  return JSON.parse(JSON.stringify(tags)) as TagDefinitionModel[]
}

/** 目的: アチーブメント編集state配列を安全に複製する。副作用: なし。前提: JSONシリアライズ可能な構造である。 */
function cloneEditorStates(states: AchievementEditorState[]): AchievementEditorState[] {
  return JSON.parse(JSON.stringify(states)) as AchievementEditorState[]
}

/** 目的: タグ一覧表示向けにネスト構造を平坦化する。副作用: なし。前提: depth は0以上の整数である。 */
function flattenTagRows(
  tags: TagDefinitionModel[],
  depth: number = 0,
  pathPrefix: TagPath = []
): FlatTagRow[] {
  return tags.flatMap((tag, currentIndex) => {
    const currentPath = [...pathPrefix, currentIndex]
    const currentRow: FlatTagRow = {
      id: tag.id,
      name: typeof tag.name === 'string' ? tag.name : '',
      depth,
      targetVersion: typeof tag.targetVersion === 'number' ? tag.targetVersion : 0,
      iconPath: typeof tag.iconPath === 'string' ? tag.iconPath : '',
      path: currentPath,
    }
    const children = flattenTagRows(
      Array.isArray(tag.tags) ? tag.tags : [],
      depth + 1,
      currentPath
    )
    return [currentRow, ...children]
  })
}

/** 目的: パスが指す兄弟配列の要素数を返す。副作用: なし。前提: path は0以上の配列インデックスで構成される。 */
function getSiblingCountByPath(tags: TagDefinitionModel[], path: TagPath): number {
  if (path.length === 0) {
    return 0
  }
  if (path.length === 1) {
    return tags.length
  }
  let currentTags = tags
  for (let depth = 0; depth < path.length - 1; depth += 1) {
    const currentTag = currentTags[path[depth]]
    if (!currentTag || !Array.isArray(currentTag.tags)) {
      return 0
    }
    if (depth === path.length - 2) {
      return currentTag.tags.length
    }
    currentTags = currentTag.tags
  }
  return 0
}

/** 目的: タグ名重複チェック用に全タグ名を抽出する。副作用: なし。前提: tagsはTagDefinitionModel配列である。 */
function collectTagNames(tags: TagDefinitionModel[]): string[] {
  return tags.flatMap((tag) => {
    const currentName = typeof tag.name === 'string' ? [tag.name] : []
    return [...currentName, ...collectTagNames(Array.isArray(tag.tags) ? tag.tags : [])]
  })
}

/** 目的: 旧Vueの `/tag` 責務をReactで提供する。副作用: Cloud Storage読込とsave_text保存を実行する。前提: 認証セッションが有効である。 */
export function TagEditorPage(): JSX.Element {
  const backendBaseUrl =
    (import.meta.env.VITE_ACHIEVEMENT_BACKEND_BASE_URL as string | undefined) ?? ''
  const cloudStorageBaseUrl =
    (import.meta.env.VITE_ACHIEVEMENT_DATA_BASE_URL as string | undefined) ?? undefined
  const { showSnackbar } = useAppSnackbar()

  const [tags, setTags] = useState<TagDefinitionModel[]>([])
  const [baseTags, setBaseTags] = useState<TagDefinitionModel[]>([])
  const [achievementStates, setAchievementStates] = useState<AchievementEditorState[]>([])
  const [baseAchievementStates, setBaseAchievementStates] = useState<AchievementEditorState[]>([])
  const [isForceTagUpdate, setIsForceTagUpdate] = useState<boolean>(false)
  const [tagId, setTagId] = useState<number>(1)
  const [tagName, setTagName] = useState<string>('')
  const [tagTargetVersion, setTagTargetVersion] = useState<number>(0)
  const [tagIconPath, setTagIconPath] = useState<string>('tag/img/')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  /** 目的: 共通スナックバーへメッセージを通知する。副作用: 全画面通知レイヤーを表示する。前提: Provider配下で実行される。 */
  const setMessage = useCallback((text: string, color: SnackbarColor = 'primary'): void => {
    showSnackbar({ text, color })
  }, [showSnackbar])

  useEffect(() => {
    let cancelled = false

    /** 目的: タグ定義と全アチーブメント編集データを初期ロードする。副作用: state更新を行う。前提: Cloud Storageパスが有効である。 */
    const loadData = async (): Promise<void> => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const [loadedTags, loadedAchievementStates] = await Promise.all([
          loadTagDefinitions({ cloudStorageBaseUrl }),
          loadAllEditorStates({ cloudStorageBaseUrl }),
        ])
        if (cancelled) {
          return
        }
        const sortedTags = sortTagDefinitionsById(loadedTags)
        setTags(sortedTags)
        setBaseTags(cloneTags(sortedTags))
        setAchievementStates(loadedAchievementStates)
        setBaseAchievementStates(cloneEditorStates(loadedAchievementStates))
        setTagId(getLatestTagDefinitionId(sortedTags) + 1)
      } catch (error) {
        if (cancelled) {
          return
        }
        const reason = error instanceof Error ? error.message : String(error)
        setErrorMessage(`タグ編集データの取得に失敗しました: ${reason}`)
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

  const isTagUpdated = useMemo((): boolean => {
    return JSON.stringify(tags) !== JSON.stringify(baseTags)
  }, [baseTags, tags])

  const isAchievementUpdated = useMemo((): boolean => {
    return JSON.stringify(achievementStates) !== JSON.stringify(baseAchievementStates)
  }, [achievementStates, baseAchievementStates])

  const flatTagRows = useMemo((): FlatTagRow[] => {
    return flattenTagRows(tags)
  }, [tags])

  /** 目的: 新規タグを追加し、必要なら強制ID追従を全アチーブメントへ適用する。副作用: tags/achievementStatesを更新する。前提: tagIdは1以上の整数である。 */
  const handleAddTag = (): void => {
    if (!Number.isInteger(tagId) || tagId < 1) {
      setMessage('タグIDは1以上の整数を指定してください。', 'warning')
      return
    }
    const normalizedName = tagName.trim()
    if (normalizedName === '') {
      setMessage('タグ名は必須です。', 'warning')
      return
    }

    const existingIds = flatTagRows.map((row) => row.id)
    const existingNames = collectTagNames(tags)
    if (!isForceTagUpdate && existingIds.includes(tagId)) {
      setMessage(`タグID ${tagId} は既に存在します。`, 'warning')
      return
    }
    if (!isForceTagUpdate && existingNames.includes(normalizedName)) {
      setMessage(`タグ名「${normalizedName}」は既に存在します。`, 'warning')
      return
    }

    let nextTags = cloneTags(tags)
    let nextAchievementStates = cloneEditorStates(achievementStates)
    if (isForceTagUpdate) {
      const forcedResult = applyForcedTagInsertionAcrossEditorStates(nextAchievementStates, nextTags, tagId)
      nextTags = forcedResult.tags
      nextAchievementStates = forcedResult.states
    }

    const nextTag: TagDefinitionModel = {
      id: tagId,
      name: normalizedName,
      targetVersion: tagTargetVersion,
      iconPath: tagIconPath.trim() === '' ? 'tag/img/' : tagIconPath.trim(),
      flatIcon: false,
      tags: [],
    }
    const mergedTags = addTopLevelTagDefinition(nextTags, nextTag)
    setTags(mergedTags)
    setAchievementStates(nextAchievementStates)
    setTagId(getLatestTagDefinitionId(mergedTags) + 1)
    setTagName('')
    setTagTargetVersion(0)
    setTagIconPath('tag/img/')
    setMessage(
      isForceTagUpdate
        ? 'タグを追加し、全アチーブメントのtagId参照を強制更新しました。'
        : 'タグを追加しました。'
    )
  }

  /** 目的: 指定タグを削除し、必要なら強制ID追従を全アチーブメントへ適用する。副作用: tags/achievementStatesを更新する。前提: tagId は既存タグIDである。 */
  const handleDeleteTag = (targetTagId: number, path: TagPath): void => {
    const removedResult = deleteTagDefinitionByPathWithPromote(tags, path)
    if (!removedResult.removed) {
      setMessage(`タグID ${targetTagId} が見つかりませんでした。`, 'warning')
      return
    }

    let nextTags = removedResult.tags
    let nextAchievementStates = cloneEditorStates(achievementStates)
    if (isForceTagUpdate) {
      const forcedResult = applyForcedTagDeletionAcrossEditorStates(
        nextAchievementStates,
        nextTags,
        targetTagId
      )
      nextTags = forcedResult.tags
      nextAchievementStates = forcedResult.states
    }

    setTags(nextTags)
    setAchievementStates(nextAchievementStates)
    setTagId(getLatestTagDefinitionId(nextTags) + 1)
    setMessage(
      isForceTagUpdate
        ? `タグID ${targetTagId} を削除し、全アチーブメントのtagId参照を強制更新しました。`
        : `タグID ${targetTagId} を削除しました。`
    )
  }

  /** 目的: 指定タグを同階層で一つ上へ移動する。副作用: tagsを更新する。前提: path は既存タグを指す。 */
  const handleMoveTagUp = (path: TagPath): void => {
    setTags((currentTags) => moveTagDefinitionUp(currentTags, path))
    setMessage('タグの並び順を上へ移動しました。')
  }

  /** 目的: 指定タグを同階層で一つ下へ移動する。副作用: tagsを更新する。前提: path は既存タグを指す。 */
  const handleMoveTagDown = (path: TagPath): void => {
    setTags((currentTags) => moveTagDefinitionDown(currentTags, path))
    setMessage('タグの並び順を下へ移動しました。')
  }

  /** 目的: 指定タグを直前兄弟の子タグとしてネストする。副作用: tagsを更新する。前提: path が同階層の先頭以外を指す。 */
  const handleIndentTag = (path: TagPath): void => {
    setTags((currentTags) => indentTagDefinition(currentTags, path))
    setMessage('タグを子階層へ移動しました。')
  }

  /** 目的: 指定タグを親階層へ戻す。副作用: tagsを更新する。前提: path が2階層以上のタグを指す。 */
  const handleOutdentTag = (path: TagPath): void => {
    setTags((currentTags) => outdentTagDefinition(currentTags, path))
    setMessage('タグを親階層へ戻しました。')
  }

  /** 目的: タグ定義をsave_textへ保存する。副作用: HTTP POSTを実行し、baseTagsを更新する。前提: 認証セッションが有効である。 */
  const handleSaveTags = async (): Promise<void> => {
    try {
      await saveTagDefinitionsToBackend(tags, {
        backendBaseUrl,
      })
      setBaseTags(cloneTags(tags))
      setMessage('タグ定義を保存しました。')
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setMessage(`タグ定義の保存に失敗しました: ${reason}`, 'error')
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
          <CardTitle>Tag</CardTitle>
          <CardDescription>タグ定義とアチーブメント編集データを読み込んでいます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (errorMessage !== '') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tag</CardTitle>
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
            <CardTitle>Tag</CardTitle>
            {isTagUpdated ? <Badge variant="subtle">タグ未保存</Badge> : <Badge variant="subtle">タグ保存済み</Badge>}
            {isAchievementUpdated ? (
              <Badge variant="subtle">アチーブメント未保存</Badge>
            ) : (
              <Badge variant="subtle">アチーブメント保存済み</Badge>
            )}
          </div>
          <CardDescription>旧 `/tag` の強制ID更新（isForceTagUpdate）を含む管理画面です。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <label className="text-xs text-[var(--ink-subtle)]">
              タグID
              <Input type="number" value={tagId} onChange={(event) => setTagId(Number(event.currentTarget.value))} />
            </label>
            <label className="text-xs text-[var(--ink-subtle)]">
              タグ名
              <Input value={tagName} onChange={(event) => setTagName(event.currentTarget.value)} />
            </label>
            <label className="text-xs text-[var(--ink-subtle)]">
              対象バージョン
              <Input
                type="number"
                value={tagTargetVersion}
                onChange={(event) => setTagTargetVersion(Number(event.currentTarget.value))}
              />
            </label>
            <label className="text-xs text-[var(--ink-subtle)]">
              アイコンパス
              <Input value={tagIconPath} onChange={(event) => setTagIconPath(event.currentTarget.value)} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={isForceTagUpdate}
                onChange={(event) => setIsForceTagUpdate(event.currentTarget.checked)}
              />
              タグID強制更新
            </label>
            <Button type="button" onClick={handleAddTag}>
              追加
            </Button>
            <Button type="button" variant="secondary" onClick={() => void handleSaveTags()} disabled={!isTagUpdated}>
              タグ保存
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
          <CardTitle className="text-xl">タグ一覧 ({flatTagRows.length})</CardTitle>
          <CardDescription>削除時はネスト子タグをトップレベルへ退避します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {flatTagRows.map((row) => (
            <div key={`${row.id}-${row.depth}-${row.name}`} className="rounded-xl border border-[var(--line)] bg-white px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold" style={{ paddingLeft: `${row.depth * 16}px` }}>
                  {row.id}. {row.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveTagUp(row.path)}
                    disabled={row.path[row.path.length - 1] <= 0}
                  >
                    上
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveTagDown(row.path)}
                    disabled={row.path[row.path.length - 1] >= getSiblingCountByPath(tags, row.path) - 1}
                  >
                    下
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleIndentTag(row.path)}
                    disabled={row.path[row.path.length - 1] <= 0}
                  >
                    子へ
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOutdentTag(row.path)}
                    disabled={row.path.length < 2}
                  >
                    親へ
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(row.id, row.path)}
                  >
                    削除
                  </Button>
                </div>
              </div>
              <p className="text-xs text-[var(--ink-subtle)]">
                targetVersion: {row.targetVersion} / iconPath: {row.iconPath === '' ? '-' : row.iconPath}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
