import { sortAchievementsBySourceIndex } from './categoryEditorDomain'
import {
  type AchievementCategoryModel,
  type AchievementGroupModel,
  type EditAchievementModel,
} from '../model/types'

export type RawEditedAchievement = {
  title?: string
  description?: string
  sourceIndex?: number
  tagIds?: number[]
  patchId?: number
  adjustmentPatchId?: number
  isLatestPatch?: boolean
  [key: string]: unknown
}

export type RawEditedAchievementGroup = {
  title?: string
  data?: RawEditedAchievement[]
}

export type RawEditedAchievementFile = {
  title?: string
  categorized?: RawEditedAchievementGroup[]
}

/** 目的: 未分類グループを表すタイトルかどうかを判定する。副作用: なし。前提: title は任意文字列で渡される。 */
function isUngroupTitle(title: string): boolean {
  const normalizedTitle = title.trim().toLowerCase()
  return (
    normalizedTitle === '未分類' ||
    normalizedTitle === 'ungroup' ||
    normalizedTitle === '_ungroup' ||
    normalizedTitle === 'uncategorized'
  )
}

/** 目的: Rawアチーブメントを編集画面用モデルへ変換する。副作用: なし。前提: fallbackId は重複しない識別子として渡される。 */
function fromRawAchievement(
  rawAchievement: RawEditedAchievement,
  fallbackId: string
): EditAchievementModel {
  return {
    id: fallbackId,
    title: typeof rawAchievement.title === 'string' ? rawAchievement.title : '(untitled)',
    description:
      typeof rawAchievement.description === 'string'
        ? rawAchievement.description
        : '',
    iconUrl: typeof rawAchievement.iconUrl === 'string' ? rawAchievement.iconUrl : undefined,
    iconPath: typeof rawAchievement.iconPath === 'string' ? rawAchievement.iconPath : undefined,
    point: typeof rawAchievement.point === 'number' ? rawAchievement.point : undefined,
    url: typeof rawAchievement.url === 'string' ? rawAchievement.url : undefined,
    isCreated:
      typeof rawAchievement.isCreated === 'boolean'
        ? rawAchievement.isCreated
        : undefined,
    isEdited:
      typeof rawAchievement.isEdited === 'boolean' ? rawAchievement.isEdited : undefined,
    isNowCreated:
      typeof rawAchievement.isNowCreated === 'boolean'
        ? rawAchievement.isNowCreated
        : undefined,
    titleAward:
      typeof rawAchievement.titleAward === 'string'
        ? rawAchievement.titleAward
        : undefined,
    titleAwardMan:
      typeof rawAchievement.titleAwardMan === 'string'
        ? rawAchievement.titleAwardMan
        : undefined,
    titleAwardWoman:
      typeof rawAchievement.titleAwardWoman === 'string'
        ? rawAchievement.titleAwardWoman
        : undefined,
    itemAward:
      typeof rawAchievement.itemAward === 'string'
        ? rawAchievement.itemAward
        : undefined,
    itemAwardUrl:
      typeof rawAchievement.itemAwardUrl === 'string'
        ? rawAchievement.itemAwardUrl
        : undefined,
    itemAwardImageUrl:
      typeof rawAchievement.itemAwardImageUrl === 'string'
        ? rawAchievement.itemAwardImageUrl
        : undefined,
    itemAwardImagePath:
      typeof rawAchievement.itemAwardImagePath === 'string'
        ? rawAchievement.itemAwardImagePath
        : undefined,
    awardCondition: Array.isArray(rawAchievement.awardCondition)
      ? rawAchievement.awardCondition.filter(
          (condition): condition is string => typeof condition === 'string'
        )
      : undefined,
    sourceIndex:
      typeof rawAchievement.sourceIndex === 'number'
        ? rawAchievement.sourceIndex
        : -1,
    tagIds: Array.isArray(rawAchievement.tagIds)
      ? rawAchievement.tagIds.filter(
          (tagId): tagId is number => typeof tagId === 'number'
        )
      : [],
    patchId: typeof rawAchievement.patchId === 'number' ? rawAchievement.patchId : 0,
    adjustmentPatchId:
      typeof rawAchievement.adjustmentPatchId === 'number'
        ? rawAchievement.adjustmentPatchId
        : 0,
    isLatestPatch:
      typeof rawAchievement.isLatestPatch === 'boolean'
        ? rawAchievement.isLatestPatch
        : false,
    raw: { ...rawAchievement },
  }
}

/** 目的: 編集画面用モデルをRawアチーブメントへ逆変換する。副作用: なし。前提: model.raw に未知プロパティが保持されている可能性がある。 */
function toRawAchievement(model: EditAchievementModel): RawEditedAchievement {
  return {
    ...(model.raw ?? {}),
    title: model.title,
    description: model.description,
    iconUrl: model.iconUrl,
    iconPath: model.iconPath,
    point: model.point,
    url: model.url,
    isCreated: model.isCreated,
    isEdited: model.isEdited,
    isNowCreated: model.isNowCreated,
    titleAward: model.titleAward,
    titleAwardMan: model.titleAwardMan,
    titleAwardWoman: model.titleAwardWoman,
    itemAward: model.itemAward,
    itemAwardUrl: model.itemAwardUrl,
    itemAwardImageUrl: model.itemAwardImageUrl,
    itemAwardImagePath: model.itemAwardImagePath,
    awardCondition: model.awardCondition,
    sourceIndex: model.sourceIndex,
    tagIds: model.tagIds,
    patchId: model.patchId,
    adjustmentPatchId: model.adjustmentPatchId,
    isLatestPatch: model.isLatestPatch,
  }
}

/** 目的: 旧JSON形式をカテゴリ編集モデルへ変換する。副作用: なし。前提: categorized配列はグループ単位データを含む。 */
export function fromRawEditedAchievementFile(
  rawFile: RawEditedAchievementFile
): AchievementCategoryModel {
  const fileTitle = typeof rawFile.title === 'string' ? rawFile.title : 'unknown'
  const categorizedGroups = Array.isArray(rawFile.categorized)
    ? rawFile.categorized
    : []

  const ungroup: EditAchievementModel[] = []
  const group: AchievementGroupModel[] = []

  categorizedGroups.forEach((rawGroup, groupIndex) => {
    const groupTitle = typeof rawGroup.title === 'string' ? rawGroup.title : `group_${groupIndex}`
    const rawItems = Array.isArray(rawGroup.data) ? rawGroup.data : []
    const mappedItems = sortAchievementsBySourceIndex(
      rawItems.map((rawAchievement, itemIndex) =>
        fromRawAchievement(rawAchievement, `${fileTitle}-${groupIndex}-${itemIndex}`)
      )
    )

    if (isUngroupTitle(groupTitle)) {
      ungroup.push(...mappedItems)
      return
    }
    group.push({
      title: groupTitle,
      data: mappedItems,
    })
  })

  return {
    title: fileTitle,
    path: fileTitle,
    ungroup: sortAchievementsBySourceIndex(ungroup),
    group,
  }
}

/** 目的: カテゴリ編集モデルを旧JSON保存形式へ変換する。副作用: なし。前提: 未分類データは`未分類`グループとして先頭へ出力する。 */
export function toRawEditedAchievementFile(
  category: AchievementCategoryModel
): RawEditedAchievementFile {
  const categorized: RawEditedAchievementGroup[] = []
  if (category.ungroup.length > 0) {
    categorized.push({
      title: '未分類',
      data: sortAchievementsBySourceIndex(category.ungroup).map(toRawAchievement),
    })
  }

  category.group.forEach((groupItem) => {
    categorized.push({
      title: groupItem.title,
      data: sortAchievementsBySourceIndex(groupItem.data).map(toRawAchievement),
    })
  })

  return {
    title: category.path,
    categorized,
  }
}
