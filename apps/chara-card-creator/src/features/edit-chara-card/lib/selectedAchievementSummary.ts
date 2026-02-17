import {
  buildCompletedAchievementTitleMap,
  getAchievementKindDefinitions,
  loadAchievementCategoryByPath,
} from '../../select-achievement/lib/selectAchievementDataSource'
import {
  type AchievementIndexPath,
  type AchievementKindKey,
  type CharacterSessionResponse,
  type SelectableAchievement,
  type SelectableAchievementCategory,
} from '../../select-achievement/model/types'

export type SelectedAchievementSummary = {
  path: AchievementIndexPath
  kindName: string
  categoryName: string
  groupTitle: string
  achievementTitle: string
  description: string
  isCompleted: boolean
  completedDate?: string
  patchId: number
  adjustmentPatchId: number
  titleAward?: string
  titleAwardMan?: string
  titleAwardWoman?: string
  itemAward?: string
  itemAwardImageUrl?: string
  itemAwardImagePath?: string
}

/** 目的: path構造を一意文字列へ変換する。副作用: なし。前提: indexは0以上の数値を受け取る。 */
function buildPathKey(path: AchievementIndexPath): string {
  return `${path.kindIndex}:${path.categoryIndex}:${path.groupIndex}:${path.achievementIndex}`
}

/** 目的: 読み込み失敗時のフォールバック要約を返す。副作用: なし。前提: 表示継続のため最低限の情報を返す。 */
function buildFallbackSummary(path: AchievementIndexPath): SelectedAchievementSummary {
  return {
    path,
    kindName: 'Unknown Kind',
    categoryName: 'Unknown Category',
    groupTitle: 'Unknown Group',
    achievementTitle: 'Unknown Achievement',
    description: '',
    isCompleted: false,
    patchId: 0,
    adjustmentPatchId: 0,
  }
}

/** 目的: 1カテゴリ内の選択path一覧から要約を作成する。副作用: なし。前提: category は loadAchievementCategoryByPath の戻り値である。 */
function buildCategorySummaries(
  category: SelectableAchievementCategory,
  paths: AchievementIndexPath[],
  kindName: string,
  categoryName: string
): Map<string, SelectedAchievementSummary> {
  const result = new Map<string, SelectedAchievementSummary>()

  for (const path of paths) {
    const group = category.group[path.groupIndex]
    const achievement: SelectableAchievement | undefined = group?.data[path.achievementIndex]
    if (!group || !achievement) {
      result.set(buildPathKey(path), buildFallbackSummary(path))
      continue
    }
    result.set(buildPathKey(path), {
      path,
      kindName,
      categoryName,
      groupTitle: group.title,
      achievementTitle: achievement.title,
      description: achievement.description,
      isCompleted: achievement.isCompleted,
      completedDate: achievement.completedDate,
      patchId: achievement.patchId,
      adjustmentPatchId: achievement.adjustmentPatchId,
      titleAward: achievement.titleAward,
      titleAwardMan: achievement.titleAwardMan,
      titleAwardWoman: achievement.titleAwardWoman,
      itemAward: achievement.itemAward,
      itemAwardImageUrl: achievement.itemAwardImageUrl,
      itemAwardImagePath: achievement.itemAwardImagePath,
    })
  }

  return result
}

/** 目的: 選択済みpath配列を表示用サマリーへ解決する。副作用: Cloud Storage読込を実行する。前提: characterSessionは取得済みである。 */
export async function loadSelectedAchievementSummaries(
  selectedPaths: AchievementIndexPath[],
  characterSession: CharacterSessionResponse
): Promise<SelectedAchievementSummary[]> {
  if (selectedPaths.length <= 0) {
    return []
  }

  const kindDefinitions = getAchievementKindDefinitions()
  const completedTitleMap = buildCompletedAchievementTitleMap(characterSession)

  const groupedPathMap = new Map<
    string,
    {
      kindKey: AchievementKindKey
      categoryId: string
      kindName: string
      categoryName: string
      paths: AchievementIndexPath[]
    }
  >()
  for (const path of selectedPaths) {
    const kindDefinition = kindDefinitions[path.kindIndex]
    const categoryDefinition = kindDefinition?.categories[path.categoryIndex]
    if (!kindDefinition || !categoryDefinition) {
      continue
    }
    const key = `${kindDefinition.key}:${categoryDefinition.id}`
    const grouped = groupedPathMap.get(key)
    if (grouped) {
      grouped.paths.push(path)
      continue
    }
    groupedPathMap.set(key, {
      kindKey: kindDefinition.key,
      categoryId: categoryDefinition.id,
      kindName: kindDefinition.name,
      categoryName: categoryDefinition.name,
      paths: [path],
    })
  }

  const summaryMap = new Map<string, SelectedAchievementSummary>()
  for (const grouped of groupedPathMap.values()) {
    if (grouped.kindKey === undefined || grouped.categoryId === '') {
      for (const path of grouped.paths) {
        summaryMap.set(buildPathKey(path), buildFallbackSummary(path))
      }
      continue
    }

    try {
      const category = await loadAchievementCategoryByPath(
        grouped.kindKey,
        grouped.categoryId,
        completedTitleMap
      )
      const resolvedMap = buildCategorySummaries(
        category,
        grouped.paths,
        grouped.kindName,
        grouped.categoryName
      )
      for (const [pathKey, summary] of resolvedMap.entries()) {
        summaryMap.set(pathKey, summary)
      }
    } catch (_error) {
      for (const path of grouped.paths) {
        summaryMap.set(buildPathKey(path), buildFallbackSummary(path))
      }
    }
  }

  return selectedPaths.map((path) => summaryMap.get(buildPathKey(path)) ?? buildFallbackSummary(path))
}
