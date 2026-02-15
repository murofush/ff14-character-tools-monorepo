import {
  type AchievementKindDefinition,
  type AchievementKindKey,
  type CharacterSessionResponse,
  type SelectableAchievement,
  type SelectableAchievementCategory,
  type SelectableAchievementGroup,
} from '../model/types'

const DEFAULT_CLOUD_STORAGE_BASE_URL = 'https://forfan-resource.storage.googleapis.com'

const routeCategoryPathMap: Record<AchievementKindKey, string[]> = {
  battle: [
    'battle',
    'dungeons',
    'field_operations',
    'raids',
    'the_hunt',
    'treasure_hunt',
    'trials',
  ],
  character: [
    'commendation',
    'disciples_of_magic',
    'disciples_of_the_hand',
    'disciples_of_the_land',
    'disciples_of_war',
    'general',
    'gold_saucer',
  ],
  crafting_gathering: [
    'alchemist',
    'all_disciplines',
    'armorer',
    'blacksmith',
    'botanist',
    'carpenter',
    'culinarian',
    'fisher',
    'goldsmith',
    'leatherworker',
    'miner',
    'weaver',
  ],
  exploration: [
    'abalathias_spine',
    'coerthas',
    'dravania',
    'duty',
    'gyr_abania',
    'la_noscea',
    'mor_dhona',
    'norvrandt',
    'othard',
    'sightseeing_log',
    'thanalan',
    'the_black_shroud',
  ],
  grand_company: [
    'grand_company',
    'immortal_flames',
    'maelstrom',
    'order_of_the_twin_adder',
  ],
  items: [
    'anima_weapons',
    'collectables',
    'currency',
    'deep_dungeon_weapons',
    'desynthesis',
    'eureka_weapons',
    'items',
    'materia',
    'relic_weapons',
    'resistance_weapons',
    'skysteel_tools',
    'zodiac_weapons',
  ],
  legacy: [
    'battle',
    'currency',
    'dungeons',
    'exploration',
    'gathering',
    'grand_company',
    'quests',
    'seasonal_events',
  ],
  pvp: ['frontline', 'general', 'ranking', 'rival_wings', 'the_wolves_den'],
  quests: ['beast_tribe_quests', 'levequests', 'quest', 'seasonal_events'],
}

const kindLabelMap: Record<AchievementKindKey, string> = {
  battle: 'Battle',
  character: 'Character',
  crafting_gathering: 'Crafting/Gathering',
  exploration: 'Exploration',
  grand_company: 'Grand Company',
  items: 'Items',
  legacy: 'Legacy',
  pvp: 'PvP',
  quests: 'Quests',
}

type DataSourceOptions = {
  cloudStorageBaseUrl?: string
  fetcher?: typeof fetch
}

type RawEditedAchievement = {
  title?: string
  description?: string
  iconUrl?: string
  iconPath?: string
  point?: number
  url?: string
  sourceIndex?: number
  patchId?: number
  adjustmentPatchId?: number
  tagIds?: number[]
  isLatestPatch?: boolean
  titleAward?: string
  titleAwardMan?: string
  titleAwardWoman?: string
  itemAward?: string
  itemAwardUrl?: string
  itemAwardImageUrl?: string
  itemAwardImagePath?: string
  awardCondition?: string[]
}

type RawEditedAchievementGroup = {
  title?: string
  data?: RawEditedAchievement[]
}

export type RawEditedAchievementFile = {
  title?: string
  categorized?: RawEditedAchievementGroup[]
}

/** 目的: kind/categoryの保存契約に基づきCloud Storage相対パスを組み立てる。副作用: なし。前提: kindKey/categoryPath は小文字英数字とアンダースコアで構成される。 */
export function buildEditedAchievementPath(kindKey: AchievementKindKey, categoryPath: string): string {
  return `editedAchievementData/${kindKey}/${categoryPath}.json`
}

/** 目的: スネークケース識別子を表示用ラベルへ変換する。副作用: なし。前提: path は `foo_bar` 形式を許容する。 */
function toDisplayName(path: string): string {
  return path
    .split('_')
    .map((value) => (value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value))
    .join(' ')
}

/** 目的: `KIND` 相当のタブ定義を返す。副作用: なし。前提: routeCategoryPathMap が旧実装順で定義されている。 */
export function getAchievementKindDefinitions(): AchievementKindDefinition[] {
  return (Object.keys(routeCategoryPathMap) as AchievementKindKey[]).map((key) => ({
    key,
    name: kindLabelMap[key],
    categories: routeCategoryPathMap[key].map((categoryPath) => ({
      id: categoryPath,
      name: toDisplayName(categoryPath),
    })),
  }))
}

/** 目的: CharacterSessionResponse から kind別タイトル完了日時マップを作る。副作用: なし。前提: completedAchievementsKinds は旧互換レスポンス形式である。 */
export function buildCompletedAchievementTitleMap(
  session: CharacterSessionResponse
): Map<string, Map<string, string>> {
  const completedMap = new Map<string, Map<string, string>>()
  session.completedAchievementsKinds.forEach((kindData) => {
    const titleMap = new Map<string, string>()
    kindData.achievements.forEach((achievement) => {
      titleMap.set(achievement.title, achievement.completedDate)
    })
    completedMap.set(kindData.key, titleMap)
  })
  return completedMap
}

/** 目的: `sourceIndex` の旧並び規則（-1は末尾）を維持する比較を提供する。副作用: なし。前提: achievement.sourceIndex は数値で保持する。 */
function sortAchievementsBySourceIndex(items: SelectableAchievement[]): SelectableAchievement[] {
  return [...items].sort((a, b) => {
    const aIndex = Number.isFinite(a.sourceIndex) ? a.sourceIndex : -1
    const bIndex = Number.isFinite(b.sourceIndex) ? b.sourceIndex : -1
    if (aIndex === -1 && bIndex !== -1) {
      return 1
    }
    if (aIndex !== -1 && bIndex === -1) {
      return -1
    }
    return aIndex - bIndex
  })
}

/** 目的: 未分類グループかどうかを判定する。副作用: なし。前提: 旧データの「未分類/uncategorized/ungroup」を除外対象とする。 */
function isUncategorizedGroupTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase()
  return normalized === '未分類' || normalized === 'uncategorized' || normalized === 'ungroup'
}

/** 目的: raw achievement を選択画面モデルへ正規化し、完了フラグを付与する。副作用: なし。前提: title一致で完了実績を同期する。 */
function normalizeSelectableAchievement(
  rawAchievement: RawEditedAchievement,
  completedDate: string | undefined
): SelectableAchievement {
  return {
    title: rawAchievement.title ?? '',
    description: rawAchievement.description ?? '',
    iconUrl: rawAchievement.iconUrl,
    iconPath: rawAchievement.iconPath,
    point: rawAchievement.point,
    url: rawAchievement.url,
    sourceIndex: typeof rawAchievement.sourceIndex === 'number' ? rawAchievement.sourceIndex : -1,
    patchId: typeof rawAchievement.patchId === 'number' ? rawAchievement.patchId : 0,
    adjustmentPatchId:
      typeof rawAchievement.adjustmentPatchId === 'number' ? rawAchievement.adjustmentPatchId : 0,
    tagIds: Array.isArray(rawAchievement.tagIds)
      ? rawAchievement.tagIds.filter((tagId) => Number.isInteger(tagId))
      : [],
    isLatestPatch: Boolean(rawAchievement.isLatestPatch),
    titleAward: rawAchievement.titleAward,
    titleAwardMan: rawAchievement.titleAwardMan,
    titleAwardWoman: rawAchievement.titleAwardWoman,
    itemAward: rawAchievement.itemAward,
    itemAwardUrl: rawAchievement.itemAwardUrl,
    itemAwardImageUrl: rawAchievement.itemAwardImageUrl,
    itemAwardImagePath: rawAchievement.itemAwardImagePath,
    awardCondition: Array.isArray(rawAchievement.awardCondition)
      ? rawAchievement.awardCondition.filter((condition) => typeof condition === 'string')
      : undefined,
    isCompleted: completedDate != null,
    completedDate,
  }
}

/** 目的: rawカテゴリデータを選択画面のカテゴリモデルへ変換する。副作用: なし。前提: completedTitleMapはkindごとのタイトル一致で完了判定できる。 */
export function convertRawCategoryToSelectable(
  rawFile: RawEditedAchievementFile,
  kindKey: AchievementKindKey,
  categoryPath: string,
  completedTitleMap: Map<string, Map<string, string>>
): SelectableAchievementCategory {
  const kindCompletedMap = completedTitleMap.get(kindKey) ?? new Map<string, string>()
  const rawGroups = Array.isArray(rawFile.categorized) ? rawFile.categorized : []
  const groups: SelectableAchievementGroup[] = rawGroups
    .filter((rawGroup) => !isUncategorizedGroupTitle(rawGroup.title ?? ''))
    .map((rawGroup) => {
      const normalizedData = sortAchievementsBySourceIndex(
        (Array.isArray(rawGroup.data) ? rawGroup.data : []).map((rawAchievement) =>
          normalizeSelectableAchievement(
            rawAchievement,
            kindCompletedMap.get(rawAchievement.title ?? '')
          )
        )
      )
      return {
        title: rawGroup.title ?? '',
        data: normalizedData,
      }
    })

  return {
    title: rawFile.title ?? categoryPath,
    path: categoryPath,
    group: groups,
  }
}

/** 目的: Cloud Storage絶対URLを組み立てる。副作用: なし。前提: baseUrlは末尾スラッシュ有無を許容する。 */
function buildCloudStorageUrl(baseUrl: string, relativePath: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  return `${normalizedBaseUrl}/${relativePath}`
}

/** 目的: kind/category単位の編集済み実績データを遅延取得する。副作用: HTTP GETを実行する。前提: pathは`editedAchievementData/{kind}/{category}.json`に存在する。 */
export async function loadAchievementCategoryByPath(
  kindKey: AchievementKindKey,
  categoryPath: string,
  completedTitleMap: Map<string, Map<string, string>>,
  options: DataSourceOptions = {}
): Promise<SelectableAchievementCategory> {
  const fetcher = options.fetcher ?? fetch
  const cloudStorageBaseUrl = options.cloudStorageBaseUrl ?? DEFAULT_CLOUD_STORAGE_BASE_URL
  const targetPath = buildEditedAchievementPath(kindKey, categoryPath)
  const response = await fetcher(buildCloudStorageUrl(cloudStorageBaseUrl, targetPath))
  if (!response.ok) {
    throw new Error(`failed to fetch category data: status=${response.status} path=${targetPath}`)
  }
  const rawFile = (await response.json()) as RawEditedAchievementFile
  return convertRawCategoryToSelectable(rawFile, kindKey, categoryPath, completedTitleMap)
}
