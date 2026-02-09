import {
  type AchievementCategoryModel,
  type AchievementEditorState,
  type EditAchievementModel,
} from '../model/types'
import { sortAchievementsBySourceIndex } from './categoryEditorDomain'

/** 目的: 最小構成のアチーブメント要素を生成し、旧itemsEditor移行画面の初期データとして使う。副作用: なし。前提: id/title/sourceIndex を受け取る。 */
function createAchievement(
  id: string,
  title: string,
  sourceIndex: number,
  description: string
): EditAchievementModel {
  return {
    id,
    title,
    description,
    sourceIndex,
    tagIds: [],
    patchId: 0,
    adjustmentPatchId: 0,
    isLatestPatch: false,
  }
}

/** 目的: 旧カテゴリ編集責務を再現するためのサンプルカテゴリを生成する。副作用: なし。前提: routeKey がカテゴリ識別子として有効である。 */
function createCategory(routeKey: string, categoryLabel: string): AchievementCategoryModel {
  return {
    title: `${categoryLabel} Main`,
    path: `${routeKey}_main`,
    ungroup: sortAchievementsBySourceIndex([
      createAchievement(`${routeKey}-001`, `${categoryLabel} Achievement A`, 0, '未分類のアチーブメントA'),
      createAchievement(`${routeKey}-002`, `${categoryLabel} Achievement B`, 2, '未分類のアチーブメントB'),
      createAchievement(`${routeKey}-003`, `${categoryLabel} Draft`, -1, '手動追加相当の下書きアチーブメント'),
    ]),
    group: [
      {
        title: '初期グループ',
        data: sortAchievementsBySourceIndex([
          createAchievement(`${routeKey}-010`, `${categoryLabel} Grouped X`, 1, '分類済みアチーブメントX'),
          createAchievement(`${routeKey}-011`, `${categoryLabel} Grouped Y`, 3, '分類済みアチーブメントY'),
        ]),
      },
    ],
  }
}

/** 目的: ルート単位の編集状態を初期化する。副作用: なし。前提: routeKey/title は画面ルートに対応する。 */
export function createInitialEditorState(
  routeKey: string,
  title: string
): AchievementEditorState {
  return {
    key: routeKey,
    kindName: title,
    achievementCategories: [createCategory(routeKey, title)],
  }
}

/** 目的: 保存基準用に編集状態をディープコピーする。副作用: なし。前提: state はJSONシリアライズ可能である。 */
export function cloneEditorState(state: AchievementEditorState): AchievementEditorState {
  return JSON.parse(JSON.stringify(state)) as AchievementEditorState
}
