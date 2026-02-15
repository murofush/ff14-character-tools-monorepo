import { describe, expect, it } from 'vitest'
import {
  appendAchievementSelection,
  removeAchievementSelectionByPath,
  selectionErrorToMessage,
  toggleAchievementSelection,
  type SelectionErrorCode,
} from './selectAchievementDomain'
import { type AchievementIndexPath } from '../model/types'

/** 目的: テストで使うAchievementIndexPathを短く生成する。副作用: なし。前提: 各indexは0以上の整数で指定する。 */
function createPath(
  kindIndex: number,
  categoryIndex: number,
  groupIndex: number,
  achievementIndex: number
): AchievementIndexPath {
  return {
    kindIndex,
    categoryIndex,
    groupIndex,
    achievementIndex,
  }
}

describe('selectAchievementDomain', () => {
  it('未選択のアチーブメントを追加できる', () => {
    const result = appendAchievementSelection([], createPath(0, 1, 2, 3), 4)
    expect(result).toEqual({
      ok: true,
      value: [createPath(0, 1, 2, 3)],
    })
  })

  it('同一index pathの重複追加を拒否する', () => {
    const base = [createPath(0, 1, 2, 3)]
    const result = appendAchievementSelection(base, createPath(0, 1, 2, 3), 4)
    expect(result).toEqual({
      ok: false,
      errorCode: 'duplicated_achievement',
    })
  })

  it('最大選択数を超える追加を拒否する', () => {
    const base = [
      createPath(0, 0, 0, 0),
      createPath(0, 0, 0, 1),
      createPath(0, 0, 0, 2),
      createPath(0, 0, 0, 3),
    ]
    const result = appendAchievementSelection(base, createPath(0, 0, 0, 4), 4)
    expect(result).toEqual({
      ok: false,
      errorCode: 'max_selected_achievement',
    })
  })

  it('指定pathを選択配列から削除できる', () => {
    const base = [createPath(0, 0, 0, 0), createPath(0, 0, 0, 1)]
    const result = removeAchievementSelectionByPath(base, createPath(0, 0, 0, 0))
    expect(result).toEqual([createPath(0, 0, 0, 1)])
  })

  it('toggleで未選択なら追加、選択済みなら削除できる', () => {
    const added = toggleAchievementSelection([], createPath(0, 0, 0, 0), 4)
    expect(added).toEqual({
      ok: true,
      value: [createPath(0, 0, 0, 0)],
    })

    if (!added.ok) {
      throw new Error('toggle add should be success')
    }
    const removed = toggleAchievementSelection(added.value, createPath(0, 0, 0, 0), 4)
    expect(removed).toEqual({
      ok: true,
      value: [],
    })
  })

  it('エラーコードを旧実装互換メッセージへ変換できる', () => {
    const duplicatedMessage = selectionErrorToMessage('duplicated_achievement')
    expect(duplicatedMessage).toBe('INTERNAL_ERROR: 選択されたアチーブメントが重複しています。')

    const maxMessage = selectionErrorToMessage('max_selected_achievement')
    expect(maxMessage).toBe('既にアチーブメントが最大数選択されています。')

    const exhaustiveCheck: SelectionErrorCode = 'max_selected_achievement'
    expect(selectionErrorToMessage(exhaustiveCheck)).not.toBe('')
  })
})
