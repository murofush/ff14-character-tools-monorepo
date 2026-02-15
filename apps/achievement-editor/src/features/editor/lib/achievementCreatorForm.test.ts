import { describe, expect, test } from 'vitest'
import {
  createManualAchievement,
  isLocalErrorPayload,
  validateAchievementCreatorForm,
  type AchievementCreatorFormState,
} from './achievementCreatorForm'

/** 目的: テストで使うフォーム初期値を生成する。副作用: なし。前提: 最小必須項目は呼び出し側で上書きする。 */
function createBaseFormState(): AchievementCreatorFormState {
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

describe('achievement creator form contract', () => {
  test('アチーブメントURLのバリデーションを行う', () => {
    const errors = validateAchievementCreatorForm(
      { ...createBaseFormState(), achievementURL: 'https://example.com/invalid' },
      { mode: 'fetch' }
    )
    expect(errors.achievementURL).toContain('アチーブメントURLはLodestoneの実績詳細URL形式で入力してください。')
  })

  test('手入力作成時に必須項目不足を検出する', () => {
    const errors = validateAchievementCreatorForm(
      {
        ...createBaseFormState(),
        title: 't',
        description: 'd',
      },
      { mode: 'manual' }
    )
    expect(errors.icon).toContain('アイコン取得後の iconPath が必要です。')
  })

  test('称号男女別ON時は両方の称号名が必須', () => {
    const errors = validateAchievementCreatorForm(
      {
        ...createBaseFormState(),
        title: 't',
        description: 'd',
        fetchedIconUrl: 'https://img.finalfantasyxiv.com/lds/pc/global/images/itemicon/12/1234567890abcdef1234567890abcdef12345678.png',
        iconPath: 'achievementData/img/battle/battle/icon.png',
        isTitleAwardEnable: true,
        isTitleAwardGender: true,
        titleAwardMan: '称号(男)',
        titleAwardWoman: '',
      },
      { mode: 'manual' }
    )
    expect(errors.titleAward).toContain('称号（女性）を入力してください。')
  })

  test('手入力作成payloadを生成する', () => {
    const result = createManualAchievement({
      ...createBaseFormState(),
      title: 'テスト実績',
      description: '説明',
      fetchedIconUrl: 'https://img.finalfantasyxiv.com/lds/pc/global/images/itemicon/12/1234567890abcdef1234567890abcdef12345678.png',
      iconPath: 'achievementData/img/battle/battle/icon.png',
      isTitleAwardEnable: true,
      titleAward: '称号',
      isItemAwardEnable: true,
      itemAward: 'テストアイテム',
      fetchedItemAwardUrl: 'https://jp.finalfantasyxiv.com/lodestone/playguide/db/item/abc123/',
      itemAwardImageUrl: 'https://img.finalfantasyxiv.com/lds/pc/global/images/itemicon/12/icon.png',
      itemAwardImagePath: 'achievementData/img/battle/battle/item/icon.png',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error('manual create expected success')
    }
    expect(result.value.title).toBe('テスト実績')
    expect(result.value.sourceIndex).toBe(-1)
    expect(result.value.tagIds).toEqual([])
    expect(result.value.titleAward).toBe('称号')
    expect(result.value.itemAward).toBe('テストアイテム')
  })

  test('LocalError payload判定を行う', () => {
    expect(isLocalErrorPayload({ key: 'error', value: 'message' })).toBe(true)
    expect(isLocalErrorPayload({ ok: true })).toBe(false)
  })
})
