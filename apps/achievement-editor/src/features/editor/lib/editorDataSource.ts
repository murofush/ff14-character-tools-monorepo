import {
  fromRawEditedAchievementFile,
  toRawEditedAchievementFile,
  type RawEditedAchievementFile,
} from './editorDataContract'
import {
  type AchievementCategoryModel,
  type AchievementEditorState,
  type PatchDefinitionModel,
  type TagDefinitionModel,
} from '../model/types'
import { AuthTokenRequiredError, fetchWithAuth } from '../../auth/lib/authTokenClient'

const DEFAULT_CLOUD_STORAGE_BASE_URL = 'https://forfan-resource.storage.googleapis.com'
const TAG_DEFINITION_PATH = 'tag/tag.json'
const PATCH_DEFINITION_PATH = 'patch/patch.json'

export const routeCategoryPathMap: Record<string, string[]> = {
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

export const routeKeysForAchievementEditor = Object.keys(routeCategoryPathMap)

type DataSourceOptions = {
  cloudStorageBaseUrl?: string
  fetcher?: typeof fetch
}

type SaveTextRequestBody = {
  text: string
  path: string
}

type SaveTextOptions = {
  backendBaseUrl: string
  fetcher?: typeof fetch
}

export type AchievementSaveTarget = {
  routeKey: string
  categoryPath: string
}

/** 目的: categoryごとの編集データ相対パスを生成する。副作用: なし。前提: routeKey/categoryPath は英数字とアンダースコアで構成される。 */
export function buildEditedAchievementPath(routeKey: string, categoryPath: string): string {
  return `editedAchievementData/${routeKey}/${categoryPath}.json`
}

/** 目的: タグ定義JSONの保存/取得パスを返す。副作用: なし。前提: 旧実装互換で `tag/tag.json` を固定採用する。 */
export function buildTagDefinitionPath(): string {
  return TAG_DEFINITION_PATH
}

/** 目的: パッチ定義JSONの保存/取得パスを返す。副作用: なし。前提: 旧実装互換で `patch/patch.json` を固定採用する。 */
export function buildPatchDefinitionPath(): string {
  return PATCH_DEFINITION_PATH
}

/** 目的: 全アチーブメントカテゴリ保存対象を列挙する。副作用: なし。前提: routeKeyは `routeCategoryPathMap` に定義済みである。 */
export function buildAllAchievementSaveTargets(routeKeys: readonly string[]): AchievementSaveTarget[] {
  return routeKeys.flatMap((routeKey) =>
    (routeCategoryPathMap[routeKey] ?? []).map((categoryPath) => ({
      routeKey,
      categoryPath,
    }))
  )
}

/** 目的: Cloud Storage参照URLを組み立てる。副作用: なし。前提: baseUrlは末尾スラッシュ有無どちらも許容する。 */
function buildCloudStorageUrl(baseUrl: string, relativePath: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  return `${normalizedBaseUrl}/${relativePath}`
}

/** 目的: 指定URLから編集データJSONを取得する。副作用: HTTP GET を実行する。前提: responseはRawEditedAchievementFile互換JSONを返す。 */
async function fetchRawEditedAchievementFile(
  url: string,
  fetcher: typeof fetch
): Promise<RawEditedAchievementFile> {
  const response = await fetcher(url)
  if (!response.ok) {
    throw new Error(`failed to fetch editor data: status=${response.status} url=${url}`)
  }
  return (await response.json()) as RawEditedAchievementFile
}

/** 目的: 任意JSONレスポンスを取得して返す。副作用: HTTP GET を実行する。前提: レスポンスはJSON形式である。 */
async function fetchJsonByUrl<T>(url: string, fetcher: typeof fetch): Promise<T> {
  const response = await fetcher(url)
  if (!response.ok) {
    throw new Error(`failed to fetch data: status=${response.status} url=${url}`)
  }
  return (await response.json()) as T
}

/** 目的: rawタグ定義を再帰構造付きのTagDefinitionModelへ正規化する。副作用: なし。前提: idは数値であることを要求する。 */
function normalizeTagDefinition(rawValue: unknown): TagDefinitionModel {
  const candidate =
    rawValue !== null && typeof rawValue === 'object'
      ? (rawValue as Record<string, unknown>)
      : null
  if (candidate === null) {
    throw new Error('invalid tag definition: object is required')
  }
  const id = candidate?.id
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    throw new Error('invalid tag definition: id is required integer')
  }
  const rawChildren = Array.isArray(candidate.tags) ? candidate.tags : []
  const normalizedChildren = rawChildren.map((child) => normalizeTagDefinition(child))
  return {
    ...candidate,
    id,
    tags: normalizedChildren,
  }
}

/** 目的: rawパッチ定義をPatchDefinitionModelへ正規化する。副作用: なし。前提: idは数値であることを要求する。 */
function normalizePatchDefinition(rawValue: unknown): PatchDefinitionModel {
  const candidate =
    rawValue !== null && typeof rawValue === 'object'
      ? (rawValue as Record<string, unknown>)
      : null
  if (candidate === null) {
    throw new Error('invalid patch definition: object is required')
  }
  const id = candidate?.id
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    throw new Error('invalid patch definition: id is required integer')
  }
  return {
    ...candidate,
    id,
  }
}

/** 目的: ルート単位で編集対象カテゴリデータをCloud Storageから読み込む。副作用: 外部HTTPアクセスを実行する。前提: routeKeyはrouteCategoryPathMapに存在する。 */
export async function loadEditorStateByRoute(
  routeKey: string,
  title: string,
  options: DataSourceOptions = {}
): Promise<AchievementEditorState> {
  const categoryPaths = routeCategoryPathMap[routeKey] ?? []
  const fetcher = options.fetcher ?? fetch
  const cloudStorageBaseUrl =
    options.cloudStorageBaseUrl ?? DEFAULT_CLOUD_STORAGE_BASE_URL

  const categories = await Promise.all(
    categoryPaths.map(async (categoryPath): Promise<AchievementCategoryModel> => {
      const relativePath = buildEditedAchievementPath(routeKey, categoryPath)
      const rawFile = await fetchRawEditedAchievementFile(
        buildCloudStorageUrl(cloudStorageBaseUrl, relativePath),
        fetcher
      )
      const convertedCategory = fromRawEditedAchievementFile(rawFile)
      return {
        ...convertedCategory,
        path: categoryPath,
      }
    })
  )

  return {
    key: routeKey,
    kindName: title,
    achievementCategories: categories,
  }
}

/** 目的: 旧VueのKIND全体に相当する全ルート編集データを読み込む。副作用: 複数のHTTP GETを実行する。前提: routeCategoryPathMapに定義された全routeを対象とする。 */
export async function loadAllEditorStates(
  options: DataSourceOptions = {}
): Promise<AchievementEditorState[]> {
  return Promise.all(
    routeKeysForAchievementEditor.map((routeKey) =>
      loadEditorStateByRoute(routeKey, routeKey, options)
    )
  )
}

/** 目的: タグ定義データをCloud Storageから取得する。副作用: HTTP GET を実行する。前提: 返却JSONはタグ定義配列である。 */
export async function loadTagDefinitions(options: DataSourceOptions = {}): Promise<TagDefinitionModel[]> {
  const fetcher = options.fetcher ?? fetch
  const cloudStorageBaseUrl =
    options.cloudStorageBaseUrl ?? DEFAULT_CLOUD_STORAGE_BASE_URL
  const url = buildCloudStorageUrl(cloudStorageBaseUrl, buildTagDefinitionPath())
  const rawData = await fetchJsonByUrl<unknown[]>(url, fetcher)
  if (!Array.isArray(rawData)) {
    throw new Error('invalid tag definitions: expected array')
  }
  return rawData.map((value) => normalizeTagDefinition(value))
}

/** 目的: パッチ定義データをCloud Storageから取得する。副作用: HTTP GET を実行する。前提: 返却JSONはパッチ定義配列である。 */
export async function loadPatchDefinitions(
  options: DataSourceOptions = {}
): Promise<PatchDefinitionModel[]> {
  const fetcher = options.fetcher ?? fetch
  const cloudStorageBaseUrl =
    options.cloudStorageBaseUrl ?? DEFAULT_CLOUD_STORAGE_BASE_URL
  const url = buildCloudStorageUrl(cloudStorageBaseUrl, buildPatchDefinitionPath())
  const rawData = await fetchJsonByUrl<unknown[]>(url, fetcher)
  if (!Array.isArray(rawData)) {
    throw new Error('invalid patch definitions: expected array')
  }
  return rawData.map((value) => normalizePatchDefinition(value))
}

/** 目的: save_text APIへ渡すリクエストボディを生成する。副作用: なし。前提: rawFileは保存可能なJSONシリアライズ形式である。 */
export function buildSaveTextRequestBody(
  routeKey: string,
  categoryPath: string,
  rawFile: RawEditedAchievementFile
): SaveTextRequestBody {
  return {
    text: JSON.stringify(rawFile, null, '\t'),
    path: buildEditedAchievementPath(routeKey, categoryPath),
  }
}

/** 目的: save_text APIレスポンスを認証エラー込みで検証する。副作用: エラー時にレスポンス本文を読み出す。前提: responseはsave_text APIから返却されたHTTPレスポンスである。 */
async function validateSaveTextResponse(response: Response): Promise<void> {
  if (response.status === 401) {
    throw new Error('認証の有効期限が切れました。再ログインしてください。')
  }
  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`save_text failed: status=${response.status} body=${responseText}`)
  }
}

/** 目的: 認証要否を含むsave_text呼び出し失敗理由を利用者向けメッセージへ変換する。副作用: なし。前提: unknown errorを受け取れる。 */
function normalizeSaveTextError(error: unknown): Error {
  if (error instanceof AuthTokenRequiredError) {
    return new Error('認証情報がありません。再ログインしてください。')
  }
  if (error instanceof Error) {
    return error
  }
  return new Error(String(error))
}

/** 目的: カテゴリ編集結果を /api/save_text へ保存する。副作用: HTTP POSTを実行する。前提: 認証セッションが有効である。 */
export async function saveCategoryToBackend(
  routeKey: string,
  category: AchievementCategoryModel,
  options: SaveTextOptions
): Promise<void> {
  const fetcher = options.fetcher ?? fetch
  const rawFile = toRawEditedAchievementFile(category)
  const body = buildSaveTextRequestBody(routeKey, category.path, rawFile)
  const normalizedBaseUrl = options.backendBaseUrl.replace(/\/+$/, '')
  try {
    const response = await fetchWithAuth(
      `${normalizedBaseUrl}/api/save_text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      { fetcher }
    )
    await validateSaveTextResponse(response)
  } catch (error) {
    throw normalizeSaveTextError(error)
  }
}

/** 目的: タグ定義を `/api/save_text` で保存する。副作用: HTTP POSTを実行する。前提: 認証セッションが有効である。 */
export async function saveTagDefinitionsToBackend(
  tags: TagDefinitionModel[],
  options: SaveTextOptions
): Promise<void> {
  const fetcher = options.fetcher ?? fetch
  const normalizedBaseUrl = options.backendBaseUrl.replace(/\/+$/, '')
  try {
    const response = await fetchWithAuth(
      `${normalizedBaseUrl}/api/save_text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: JSON.stringify(tags, null, '\t'),
          path: buildTagDefinitionPath(),
        }),
      },
      { fetcher }
    )
    await validateSaveTextResponse(response)
  } catch (error) {
    throw normalizeSaveTextError(error)
  }
}

/** 目的: パッチ定義を `/api/save_text` で保存する。副作用: HTTP POSTを実行する。前提: 認証セッションが有効である。 */
export async function savePatchDefinitionsToBackend(
  patches: PatchDefinitionModel[],
  options: SaveTextOptions
): Promise<void> {
  const fetcher = options.fetcher ?? fetch
  const normalizedBaseUrl = options.backendBaseUrl.replace(/\/+$/, '')
  try {
    const response = await fetchWithAuth(
      `${normalizedBaseUrl}/api/save_text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: JSON.stringify(patches, null, '\t'),
          path: buildPatchDefinitionPath(),
        }),
      },
      { fetcher }
    )
    await validateSaveTextResponse(response)
  } catch (error) {
    throw normalizeSaveTextError(error)
  }
}

/** 目的: 強制ID更新後の全アチーブメント編集データをカテゴリ単位で保存する。副作用: 複数のHTTP POSTを実行する。前提: statesはrouteKeyごとに正しいカテゴリ配列を持つ。 */
export async function saveAllEditorStatesToBackend(
  states: AchievementEditorState[],
  options: SaveTextOptions
): Promise<void> {
  await Promise.all(
    states.flatMap((state) =>
      state.achievementCategories.map(async (category) => {
        await saveCategoryToBackend(state.key, category, options)
      })
    )
  )
}

/** 目的: 指定ルートの全カテゴリ編集データを一括で保存する。副作用: 対象カテゴリ数ぶんsave_text APIへPOSTする。前提: state.keyとcategory.pathが保存先契約に一致する。 */
export async function saveEditorStateByRouteToBackend(
  state: AchievementEditorState,
  options: SaveTextOptions
): Promise<void> {
  await Promise.all(
    state.achievementCategories.map(async (category) => {
      await saveCategoryToBackend(state.key, category, options)
    })
  )
}
