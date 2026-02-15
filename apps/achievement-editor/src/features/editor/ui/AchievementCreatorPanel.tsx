import { JSX, useState } from 'react'
import { Badge } from '../../../shared/ui/badge'
import { Button } from '../../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card'
import { Input } from '../../../shared/ui/input'
import { Textarea } from '../../../shared/ui/textarea'
import { type EditAchievementModel } from '../model/types'
import {
  createManualAchievement,
  hasValidationErrors,
  isLocalErrorPayload,
  validateAchievementCreatorForm,
  type AchievementCreatorFormState,
  type AchievementCreatorValidationErrors,
} from '../lib/achievementCreatorForm'
import {
  fetchHiddenAchievement,
  fetchIconPath,
  fetchItemInformation,
} from '../lib/achievementCreatorApi'

type AchievementCreatorPanelProps = {
  categoryKey: string
  group: string
  backendBaseUrl: string
  onCreated: (achievement: EditAchievementModel) => void
  onMessage: (message: string) => void
}

/** 目的: AchievementCreatorフォームの初期値を生成する。副作用: なし。前提: 旧Vueと同等の既定値を使う。 */
function createInitialState(): AchievementCreatorFormState {
  return {
    achievementURL: '',
    title: '',
    description: '',
    iconUrl: '',
    fetchedIconUrl: '',
    iconPath: '',
    point: 10,
    isTitleAwardEnable: false,
    isTitleAwardGender: false,
    titleAward: '',
    titleAwardMan: '',
    titleAwardWoman: '',
    isItemAwardEnable: false,
    itemAward: '',
    itemAwardUrl: '',
    fetchedItemAwardUrl: '',
    itemAwardImageUrl: '',
    itemAwardImagePath: '',
    isLatestPatch: false,
  }
}

/** 目的: エラー表示を空状態へ戻す。副作用: なし。前提: 各項目のエラー配列は空で初期化する。 */
function createEmptyErrors(): AchievementCreatorValidationErrors {
  return {
    achievementURL: [],
    title: [],
    description: [],
    icon: [],
    point: [],
    titleAward: [],
    itemAward: [],
    itemAwardUrl: [],
  }
}

/** 目的: 旧achievementCreatorの責務（URL取得/補助取得/手入力作成）をReactで提供する。副作用: backend API呼び出しを実行する。前提: categoryKey/groupは保存先解決に利用できる。 */
export function AchievementCreatorPanel({
  categoryKey,
  group,
  backendBaseUrl,
  onCreated,
  onMessage,
}: AchievementCreatorPanelProps): JSX.Element {
  const [formState, setFormState] = useState<AchievementCreatorFormState>(createInitialState)
  const [errors, setErrors] = useState<AchievementCreatorValidationErrors>(createEmptyErrors)
  const [isFetchingHidden, setIsFetchingHidden] = useState<boolean>(false)
  const [isFetchingIcon, setIsFetchingIcon] = useState<boolean>(false)
  const [isFetchingItem, setIsFetchingItem] = useState<boolean>(false)

  /** 目的: 指定キーの値をフォーム状態へ反映する。副作用: React stateを更新する。前提: keyはAchievementCreatorFormStateのキーである。 */
  const setFieldValue = <TKey extends keyof AchievementCreatorFormState>(
    key: TKey,
    value: AchievementCreatorFormState[TKey]
  ): void => {
    setFormState((current) => ({ ...current, [key]: value }))
  }

  /** 目的: 入力・取得フォームを初期化する。副作用: stateを初期値へ戻す。前提: 作成完了後に呼び出す。 */
  const resetForm = (): void => {
    setFormState(createInitialState())
    setErrors(createEmptyErrors())
  }

  /** 目的: アイテム報酬だけをクリアする。副作用: item系stateを初期化する。前提: アイテム報酬欄を再入力したい時に使う。 */
  const resetItemAward = (): void => {
    setFormState((current) => ({
      ...current,
      itemAward: '',
      itemAwardUrl: '',
      fetchedItemAwardUrl: '',
      itemAwardImageUrl: '',
      itemAwardImagePath: '',
    }))
  }

  /** 目的: 取得済みiconPathをクリアする。副作用: iconPathを空にする。前提: アイコン再取得時に使う。 */
  const resetIconPath = (): void => {
    setFieldValue('iconPath', '')
  }

  /** 目的: 手入力フォームのバリデーションを実行してエラー状態を更新する。副作用: errors stateを更新する。前提: manualモードの入力検証で使う。 */
  const validateManual = (): AchievementCreatorValidationErrors => {
    const nextErrors = validateAchievementCreatorForm(formState, { mode: 'manual' })
    setErrors(nextErrors)
    return nextErrors
  }

  /** 目的: URLから隠し実績データを取得して未分類へ追加する。副作用: backend API呼び出しと親state更新を行う。前提: achievementURLが正しいLodestone実績URLである。 */
  const handleFetchAchievement = async (): Promise<void> => {
    const nextErrors = validateAchievementCreatorForm(formState, { mode: 'fetch' })
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) {
      return
    }
    setIsFetchingHidden(true)
    try {
      const response = await fetchHiddenAchievement(
        {
          url: formState.achievementURL,
          category: categoryKey,
          group,
        },
        { backendBaseUrl }
      )
      if (isLocalErrorPayload(response)) {
        onMessage(`取得エラー: ${response.value}`)
        return
      }
      onCreated({
        ...response,
        id: response.id ?? `hidden-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      })
      onMessage(`URL取得で「${response.title}」を追加しました。`)
      resetForm()
    } finally {
      setIsFetchingHidden(false)
    }
  }

  /** 目的: iconUrlからiconPathを取得してフォームへ反映する。副作用: backend API呼び出しとフォーム更新を行う。前提: iconUrlがLodestone画像URL形式である。 */
  const handleFetchIcon = async (): Promise<void> => {
    const nextErrors = validateAchievementCreatorForm(formState, { mode: 'icon-fetch' })
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) {
      return
    }
    setIsFetchingIcon(true)
    try {
      const response = await fetchIconPath(
        {
          url: formState.iconUrl,
          category: categoryKey,
          group,
        },
        { backendBaseUrl }
      )
      if (isLocalErrorPayload(response)) {
        onMessage(`icon取得エラー: ${response.value}`)
        return
      }
      setFormState((current) => ({
        ...current,
        iconPath: response,
        fetchedIconUrl: current.iconUrl,
        iconUrl: '',
      }))
      onMessage('iconPathを取得しました。')
    } finally {
      setIsFetchingIcon(false)
    }
  }

  /** 目的: アイテムURLから報酬情報を取得してフォームへ反映する。副作用: backend API呼び出しとフォーム更新を行う。前提: itemAwardUrlがLodestoneアイテムURL形式である。 */
  const handleFetchItem = async (): Promise<void> => {
    const nextErrors = validateAchievementCreatorForm(formState, { mode: 'item-fetch' })
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) {
      return
    }
    setIsFetchingItem(true)
    try {
      const response = await fetchItemInformation(
        {
          url: formState.itemAwardUrl,
          category: categoryKey,
          group,
        },
        { backendBaseUrl }
      )
      if (isLocalErrorPayload(response)) {
        onMessage(`item取得エラー: ${response.value}`)
        return
      }
      setFormState((current) => ({
        ...current,
        itemAward: response.itemAward,
        fetchedItemAwardUrl: response.itemAwardUrl,
        itemAwardImageUrl: response.itemAwardImageUrl,
        itemAwardImagePath: response.itemAwardImagePath,
      }))
      onMessage('アイテム報酬情報を取得しました。')
    } finally {
      setIsFetchingItem(false)
    }
  }

  /** 目的: 手入力フォームからアチーブメントを生成して未分類へ追加する。副作用: 親state更新を行う。前提: 必須入力が満たされている。 */
  const handleCreateManual = (): void => {
    const validationResult = validateManual()
    if (hasValidationErrors(validationResult)) {
      return
    }
    const result = createManualAchievement(formState)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    onCreated(result.value)
    onMessage(`手入力で「${result.value.title}」を追加しました。`)
    resetForm()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">Achievement Creator</CardTitle>
          <Badge variant="subtle">{categoryKey}/{group}</Badge>
        </div>
        <CardDescription>URL取得と手入力作成の両方を旧Vue契約で提供します。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-alt)] p-3">
          <p className="text-sm font-semibold">キャラクターページからアチーブメントを取得</p>
          <Input
            value={formState.achievementURL}
            placeholder="https://jp.finalfantasyxiv.com/lodestone/character/.../achievement/detail/..."
            onChange={(event) => setFieldValue('achievementURL', event.currentTarget.value)}
          />
          {errors.achievementURL.map((message) => (
            <p key={message} className="text-xs text-[var(--danger)]">{message}</p>
          ))}
          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleFetchAchievement()} disabled={isFetchingHidden}>
              {isFetchingHidden ? '取得中...' : 'URLからアチーブメントを取得'}
            </Button>
          </div>
        </section>

        <section className="space-y-2 rounded-xl border border-[var(--line)] bg-white p-3">
          <p className="text-sm font-semibold">新規アチーブメント作成</p>
          <Input value={formState.title} placeholder="タイトル" onChange={(event) => setFieldValue('title', event.currentTarget.value)} />
          {errors.title.map((message) => (
            <p key={message} className="text-xs text-[var(--danger)]">{message}</p>
          ))}

          <Textarea value={formState.description} rows={3} placeholder="説明文" onChange={(event) => setFieldValue('description', event.currentTarget.value)} />
          {errors.description.map((message) => (
            <p key={message} className="text-xs text-[var(--danger)]">{message}</p>
          ))}

          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <Input value={formState.iconUrl} placeholder="アイコンURL" onChange={(event) => setFieldValue('iconUrl', event.currentTarget.value)} />
            <Button type="button" variant="secondary" onClick={() => void handleFetchIcon()} disabled={isFetchingIcon}>
              {isFetchingIcon ? '取得中...' : 'icon Fetch'}
            </Button>
            <Button type="button" variant="ghost" onClick={resetIconPath}>clear icon</Button>
          </div>
          <p className="text-xs text-[var(--ink-subtle)]">
            fetchedIconUrl: {formState.fetchedIconUrl || '(none)'} / iconPath: {formState.iconPath || '(none)'}
          </p>
          {errors.icon.map((message) => (
            <p key={message} className="text-xs text-[var(--danger)]">{message}</p>
          ))}

          <Input
            type="number"
            value={String(formState.point)}
            placeholder="ポイント"
            onChange={(event) => setFieldValue('point', Number(event.currentTarget.value))}
          />
          {errors.point.map((message) => (
            <p key={message} className="text-xs text-[var(--danger)]">{message}</p>
          ))}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formState.isTitleAwardEnable} onChange={(event) => setFieldValue('isTitleAwardEnable', event.currentTarget.checked)} />
            報酬称号
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formState.isTitleAwardGender} disabled={!formState.isTitleAwardEnable} onChange={(event) => setFieldValue('isTitleAwardGender', event.currentTarget.checked)} />
            男女別報酬
          </label>
          {formState.isTitleAwardEnable && !formState.isTitleAwardGender ? (
            <Input value={formState.titleAward} placeholder="報酬称号名" onChange={(event) => setFieldValue('titleAward', event.currentTarget.value)} />
          ) : null}
          {formState.isTitleAwardEnable && formState.isTitleAwardGender ? (
            <div className="grid gap-2 md:grid-cols-2">
              <Input value={formState.titleAwardMan} placeholder="報酬称号:男性名" onChange={(event) => setFieldValue('titleAwardMan', event.currentTarget.value)} />
              <Input value={formState.titleAwardWoman} placeholder="報酬称号:女性名" onChange={(event) => setFieldValue('titleAwardWoman', event.currentTarget.value)} />
            </div>
          ) : null}
          {errors.titleAward.map((message) => (
            <p key={message} className="text-xs text-[var(--danger)]">{message}</p>
          ))}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formState.isItemAwardEnable} onChange={(event) => setFieldValue('isItemAwardEnable', event.currentTarget.checked)} />
            報酬アイテム
          </label>
          {formState.isItemAwardEnable ? (
            <>
              <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                <Input value={formState.itemAwardUrl} placeholder="報酬アイテムURL" onChange={(event) => setFieldValue('itemAwardUrl', event.currentTarget.value)} />
                <Button type="button" variant="secondary" onClick={() => void handleFetchItem()} disabled={isFetchingItem}>
                  {isFetchingItem ? '取得中...' : 'item Fetch'}
                </Button>
                <Button type="button" variant="ghost" onClick={resetItemAward}>clear item</Button>
              </div>
              <p className="text-xs text-[var(--ink-subtle)]">
                item: {formState.itemAward || '(none)'} / imagePath: {formState.itemAwardImagePath || '(none)'}
              </p>
            </>
          ) : null}
          {errors.itemAward.map((message) => (
            <p key={message} className="text-xs text-[var(--danger)]">{message}</p>
          ))}
          {errors.itemAwardUrl.map((message) => (
            <p key={message} className="text-xs text-[var(--danger)]">{message}</p>
          ))}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formState.isLatestPatch} onChange={(event) => setFieldValue('isLatestPatch', event.currentTarget.checked)} />
            最新パッチコンテンツ
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={resetForm}>リセット</Button>
            <Button type="button" onClick={handleCreateManual}>追加</Button>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
