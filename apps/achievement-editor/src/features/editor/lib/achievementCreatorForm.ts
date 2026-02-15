import { type EditAchievementModel } from '../model/types'

const CHARACTER_URL_REGEXP =
  /^https:\/\/(jp|na|eu|fr|de)\.finalfantasyxiv\.com\/lodestone\/character\/[0-9]+\/achievement\/detail\/[0-9a-zA-Z]+\/?$/
const ICON_URL_REGEXP =
  /^https:\/\/img\.finalfantasyxiv\.com\/lds\/pc\/global\/images\/itemicon\/[0-9a-zA-Z]+\/[0-9a-zA-Z]+\.(jpg|png|gif)(\?.*)?$/
const ITEM_URL_REGEXP =
  /^https:\/\/(jp|na|eu|fr|de)\.finalfantasyxiv\.com\/lodestone\/playguide\/db\/item\/[0-9a-zA-Z]+\/?$/

export type LocalErrorPayload = {
  key: string
  value: string
}

export type AchievementCreatorFormState = {
  achievementURL: string
  title: string
  description: string
  iconUrl: string
  fetchedIconUrl: string
  iconPath: string
  point: number
  isTitleAwardEnable: boolean
  isTitleAwardGender: boolean
  titleAward: string
  titleAwardMan: string
  titleAwardWoman: string
  isItemAwardEnable: boolean
  itemAward: string
  itemAwardUrl: string
  fetchedItemAwardUrl: string
  itemAwardImageUrl: string
  itemAwardImagePath: string
  isLatestPatch: boolean
}

type ValidationMode = 'fetch' | 'manual' | 'icon-fetch' | 'item-fetch'

type ValidationOptions = {
  mode: ValidationMode
}

export type AchievementCreatorValidationErrors = {
  achievementURL: string[]
  title: string[]
  description: string[]
  icon: string[]
  point: string[]
  titleAward: string[]
  itemAward: string[]
  itemAwardUrl: string[]
}

type CreateManualAchievementResult =
  | {
      ok: true
      value: EditAchievementModel
    }
  | {
      ok: false
      errors: AchievementCreatorValidationErrors
    }

/** 目的: APIレスポンスがLocalError形式かを判定する。副作用: なし。前提: value は不定型データである。 */
export function isLocalErrorPayload(value: unknown): value is LocalErrorPayload {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.key === 'string' && typeof candidate.value === 'string'
}

/** 目的: 空文字チェックを共通化する。副作用: なし。前提: value は任意文字列で渡される。 */
function isBlank(value: string): boolean {
  return value.trim() === ''
}

/** 目的: AchievementURLバリデーションを行う。副作用: なし。前提: Lodestone実績詳細URLのみを受け付ける。 */
function validateAchievementUrl(value: string): string[] {
  const errors: string[] = []
  if (isBlank(value)) {
    errors.push('アチーブメントURLは必須です。')
    return errors
  }
  const normalized = value.split('?')[0]
  if (!CHARACTER_URL_REGEXP.test(normalized)) {
    errors.push('アチーブメントURLはLodestoneの実績詳細URL形式で入力してください。')
  }
  return errors
}

/** 目的: iconUrlバリデーションを行う。副作用: なし。前提: LodestoneアイコンURLを受け付ける。 */
function validateIconUrl(value: string): string[] {
  const errors: string[] = []
  if (isBlank(value)) {
    errors.push('iconUrlは必須です。')
    return errors
  }
  if (!ICON_URL_REGEXP.test(value.split('?')[0])) {
    errors.push('iconUrlはLodestoneアイコンURL形式で入力してください。')
  }
  return errors
}

/** 目的: itemAwardUrlバリデーションを行う。副作用: なし。前提: LodestoneアイテムURLを受け付ける。 */
function validateItemUrl(value: string): string[] {
  const errors: string[] = []
  if (isBlank(value)) {
    errors.push('アイテムURLは必須です。')
    return errors
  }
  if (!ITEM_URL_REGEXP.test(value.split('?')[0])) {
    errors.push('アイテムURLはLodestoneアイテムURL形式で入力してください。')
  }
  return errors
}

/** 目的: フォーム状態をモード別に検証し、エラー一覧を返す。副作用: なし。前提: 旧achievementCreatorの必須条件を踏襲する。 */
export function validateAchievementCreatorForm(
  state: AchievementCreatorFormState,
  options: ValidationOptions
): AchievementCreatorValidationErrors {
  const errors: AchievementCreatorValidationErrors = {
    achievementURL: [],
    title: [],
    description: [],
    icon: [],
    point: [],
    titleAward: [],
    itemAward: [],
    itemAwardUrl: [],
  }

  if (options.mode === 'fetch') {
    errors.achievementURL = validateAchievementUrl(state.achievementURL)
    return errors
  }

  if (options.mode === 'icon-fetch') {
    errors.icon = validateIconUrl(state.iconUrl)
    return errors
  }

  if (options.mode === 'item-fetch') {
    errors.itemAwardUrl = validateItemUrl(state.itemAwardUrl)
    return errors
  }

  if (isBlank(state.title)) {
    errors.title.push('タイトルは必須です。')
  }
  if (isBlank(state.description)) {
    errors.description.push('説明文は必須です。')
  }
  if (!Number.isFinite(state.point)) {
    errors.point.push('ポイントは必須です。')
  }

  if (isBlank(state.iconPath)) {
    errors.icon.push('アイコン取得後の iconPath が必要です。')
  }
  if (isBlank(state.fetchedIconUrl)) {
    errors.icon.push('アイコン取得後の iconUrl が必要です。')
  }

  if (state.isTitleAwardEnable && !state.isTitleAwardGender && isBlank(state.titleAward)) {
    errors.titleAward.push('称号報酬を入力してください。')
  }
  if (state.isTitleAwardEnable && state.isTitleAwardGender) {
    if (isBlank(state.titleAwardMan)) {
      errors.titleAward.push('称号（男性）を入力してください。')
    }
    if (isBlank(state.titleAwardWoman)) {
      errors.titleAward.push('称号（女性）を入力してください。')
    }
  }

  if (state.isItemAwardEnable) {
    if (isBlank(state.itemAward)) {
      errors.itemAward.push('アイテム報酬名を入力してください。')
    }
    if (isBlank(state.itemAward) && isBlank(state.itemAwardUrl)) {
      errors.itemAwardUrl.push('アイテムURLは必須です。')
    } else if (!isBlank(state.itemAwardUrl) && validateItemUrl(state.itemAwardUrl).length > 0) {
      errors.itemAwardUrl.push(...validateItemUrl(state.itemAwardUrl))
    }
  }

  return errors
}

/** 目的: バリデーション結果にエラーがあるか判定する。副作用: なし。前提: errors はvalidateAchievementCreatorFormの戻り値である。 */
export function hasValidationErrors(errors: AchievementCreatorValidationErrors): boolean {
  return Object.values(errors).some((messages) => messages.length > 0)
}

/** 目的: フォーム状態から手入力作成用のアチーブメントpayloadを生成する。副作用: なし。前提: バリデーション通過状態で呼び出される。 */
export function createManualAchievement(
  state: AchievementCreatorFormState
): CreateManualAchievementResult {
  const errors = validateAchievementCreatorForm(state, { mode: 'manual' })
  if (hasValidationErrors(errors)) {
    return { ok: false, errors }
  }

  const achievement: EditAchievementModel = {
    id: `manual-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: state.title,
    description: state.description,
    iconUrl: state.fetchedIconUrl,
    iconPath: state.iconPath,
    point: state.point,
    isCreated: true,
    isEdited: true,
    isNowCreated: true,
    isLatestPatch: state.isLatestPatch,
    sourceIndex: -1,
    tagIds: [],
    adjustmentPatchId: 0,
    patchId: 0,
  }

  if (state.isTitleAwardEnable) {
    if (state.isTitleAwardGender) {
      achievement.titleAwardMan = state.titleAwardMan
      achievement.titleAwardWoman = state.titleAwardWoman
    } else {
      achievement.titleAward = state.titleAward
    }
  }

  if (state.isItemAwardEnable) {
    achievement.itemAward = state.itemAward
    achievement.itemAwardUrl = state.fetchedItemAwardUrl
    achievement.itemAwardImageUrl = state.itemAwardImageUrl
    achievement.itemAwardImagePath = state.itemAwardImagePath
  }

  return { ok: true, value: achievement }
}
