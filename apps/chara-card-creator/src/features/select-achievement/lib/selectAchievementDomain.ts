import { type AchievementIndexPath } from '../model/types'

export type SelectionErrorCode = 'max_selected_achievement' | 'duplicated_achievement'

export type SelectionResult =
  | {
      ok: true
      value: AchievementIndexPath[]
    }
  | {
      ok: false
      errorCode: SelectionErrorCode
    }

/** 目的: 2つのAchievementIndexPathが同一項目を指すかを判定する。副作用: なし。前提: pathはkind/category/group/achievement indexを持つ。 */
function isSameAchievementPath(base: AchievementIndexPath, check: AchievementIndexPath): boolean {
  return (
    base.kindIndex === check.kindIndex &&
    base.categoryIndex === check.categoryIndex &&
    base.groupIndex === check.groupIndex &&
    base.achievementIndex === check.achievementIndex
  )
}

/** 目的: 指定pathが選択済み配列のどこに存在するか返す。副作用: なし。前提: selectionsはAchievementIndexPath配列である。 */
export function findAchievementSelectionIndex(
  selections: AchievementIndexPath[],
  targetPath: AchievementIndexPath
): number {
  return selections.findIndex((selectionPath) => isSameAchievementPath(selectionPath, targetPath))
}

/** 目的: 選択配列へ新規pathを追加し、上限超過と重複を検証する。副作用: なし。前提: maxSelectionCountは1以上の整数である。 */
export function appendAchievementSelection(
  selections: AchievementIndexPath[],
  targetPath: AchievementIndexPath,
  maxSelectionCount: number
): SelectionResult {
  if (findAchievementSelectionIndex(selections, targetPath) !== -1) {
    return {
      ok: false,
      errorCode: 'duplicated_achievement',
    }
  }
  if (selections.length >= maxSelectionCount) {
    return {
      ok: false,
      errorCode: 'max_selected_achievement',
    }
  }
  return {
    ok: true,
    value: [...selections, targetPath],
  }
}

/** 目的: 指定pathを選択配列から削除する。副作用: なし。前提: path未存在時は元配列を返す。 */
export function removeAchievementSelectionByPath(
  selections: AchievementIndexPath[],
  targetPath: AchievementIndexPath
): AchievementIndexPath[] {
  return selections.filter((selectionPath) => !isSameAchievementPath(selectionPath, targetPath))
}

/** 目的: 既存選択なら解除、未選択なら追加を行うトグル操作を提供する。副作用: なし。前提: maxSelectionCountはUI上限と一致している。 */
export function toggleAchievementSelection(
  selections: AchievementIndexPath[],
  targetPath: AchievementIndexPath,
  maxSelectionCount: number
): SelectionResult {
  if (findAchievementSelectionIndex(selections, targetPath) !== -1) {
    return {
      ok: true,
      value: removeAchievementSelectionByPath(selections, targetPath),
    }
  }
  return appendAchievementSelection(selections, targetPath, maxSelectionCount)
}

/** 目的: 旧実装互換の選択エラーメッセージを返す。副作用: なし。前提: errorCodeはSelectionErrorCodeのいずれかである。 */
export function selectionErrorToMessage(errorCode: SelectionErrorCode): string {
  if (errorCode === 'max_selected_achievement') {
    return '既にアチーブメントが最大数選択されています。'
  }
  return 'INTERNAL_ERROR: 選択されたアチーブメントが重複しています。'
}
