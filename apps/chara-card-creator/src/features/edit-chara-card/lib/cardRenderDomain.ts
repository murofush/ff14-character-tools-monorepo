import { type CardEditorSettings } from '../model/types'

const DEFAULT_RESOURCE_BASE_URL = 'https://forfan-resource.storage.googleapis.com'
const FC_CREST_BACKGROUND_IMAGE_URL = `${DEFAULT_RESOURCE_BASE_URL}/img/fc_bg.png`

export type PatchDefinition = {
  id: number
  date?: string
  [key: string]: unknown
}

export type SelectedAchievementRenderSource = {
  achievementTitle: string
  completedDate?: string
  adjustmentPatchId: number
  titleAward?: string
  titleAwardMan?: string
  titleAwardWoman?: string
  itemAward?: string
  itemAwardImageUrl?: string
  itemAwardImagePath?: string
}

export type AchievementRenderItem = {
  title: string
  completedDateLabel: string
  isUnlockedBeforeAdjustment: boolean
  titleAwardLabel: string | null
  itemAwardLabel: string | null
  itemAwardImageUrl: string | null
}

export type JobEntry = {
  category: 'battleRoles' | 'crafter' | 'gatherer'
  group: string
  jobName: string
  level: number
}

export type FreeCompanyPositionRenderItem = {
  positionImageUrl: string | null
  positionName: string | null
}

type CharacterSessionLike = {
  characterData: Record<string, unknown>
  freecompanyInfo?: Record<string, unknown>
}

/** 目的: unknown値がRecord型か判定する。副作用: なし。前提: JSON由来のunknown値を受け取る。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

/** 目的: Dateに変換可能な文字列かを判定する。副作用: なし。前提: ISO形式等の日時文字列を想定する。 */
function isValidDateText(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}

/** 目的: URLまたはCloud Storage相対パスから表示用URLを返す。副作用: なし。前提: 空文字/不正値はnullを返す。 */
export function resolveResourceImageUrl(urlOrPath: string | undefined): string | null {
  if (typeof urlOrPath !== 'string' || urlOrPath.trim() === '') {
    return null
  }
  const normalized = urlOrPath.trim()
  if (/^https?:\/\//.test(normalized)) {
    return normalized
  }
  const pathWithoutLeadingSlash = normalized.replace(/^\/+/, '')
  return `${DEFAULT_RESOURCE_BASE_URL}/${pathWithoutLeadingSlash}`
}

/** 目的: patch定義配列からid->dateマップを生成する。副作用: なし。前提: dateは未設定の可能性がある。 */
export function buildPatchDateMap(patches: PatchDefinition[]): Map<number, string> {
  const patchDateMap = new Map<number, string>()
  for (const patch of patches) {
    if (typeof patch.id !== 'number' || !Number.isInteger(patch.id)) {
      continue
    }
    if (typeof patch.date !== 'string' || !isValidDateText(patch.date)) {
      continue
    }
    patchDateMap.set(patch.id, patch.date)
  }
  return patchDateMap
}

/** 目的: FCクレスト画像URLを描画順で返す。副作用: なし。前提: 旧実装互換で先頭に背景画像を挿入する。 */
export function buildFreeCompanyCrestImageUrls(freecompanyInfo: Record<string, unknown> | undefined): string[] {
  if (!isRecord(freecompanyInfo)) {
    return []
  }
  const rawUrls = Array.isArray(freecompanyInfo.fcCrestBaseImageUrls)
    ? freecompanyInfo.fcCrestBaseImageUrls
    : []
  const crestUrls = rawUrls
    .map((value) => (typeof value === 'string' ? resolveResourceImageUrl(value) : null))
    .filter((value): value is string => value !== null)
  if (crestUrls.length <= 0) {
    return []
  }
  return [FC_CREST_BACKGROUND_IMAGE_URL, ...crestUrls]
}

/** 目的: FC所属階級画像と名称を抽出する。副作用: なし。前提: freecompanyInfoは任意項目を含む。 */
export function extractFreeCompanyPosition(
  freecompanyInfo: Record<string, unknown> | undefined
): FreeCompanyPositionRenderItem {
  if (!isRecord(freecompanyInfo)) {
    return {
      positionImageUrl: null,
      positionName: null,
    }
  }
  const positionImageUrl =
    typeof freecompanyInfo.positionBaseImageUrl === 'string'
      ? resolveResourceImageUrl(freecompanyInfo.positionBaseImageUrl)
      : null
  const positionName = typeof freecompanyInfo.positionName === 'string' ? freecompanyInfo.positionName : null
  return {
    positionImageUrl,
    positionName,
  }
}

/** 目的: 完了日と緩和パッチ日から「緩和前取得」状態を判定する。副作用: なし。前提: disabledBeforeUnlockAccent=true の場合は常に強調しない。 */
function isUnlockedBeforeAdjustment(
  completedDate: string | undefined,
  adjustmentPatchId: number,
  patchDateMap: Map<number, string>,
  disabledBeforeUnlockAccent: boolean
): boolean {
  if (disabledBeforeUnlockAccent) {
    return false
  }
  if (!completedDate || !isValidDateText(completedDate)) {
    return false
  }
  if (!Number.isInteger(adjustmentPatchId) || adjustmentPatchId <= 0) {
    return false
  }
  const adjustmentDate = patchDateMap.get(adjustmentPatchId)
  if (!adjustmentDate || !isValidDateText(adjustmentDate)) {
    return false
  }
  return new Date(completedDate).getTime() < new Date(adjustmentDate).getTime()
}

/** 目的: 性別に応じて称号報酬表示文字列を解決する。副作用: なし。前提: gender は '♂' / '♀' / その他を受け取る。 */
function resolveTitleAwardByGender(
  source: SelectedAchievementRenderSource,
  gender: string | undefined
): string | null {
  if (source.titleAward && source.titleAward !== '') {
    return source.titleAward
  }
  if (gender === '♂' && source.titleAwardMan && source.titleAwardMan !== '') {
    return source.titleAwardMan
  }
  if (gender === '♀' && source.titleAwardWoman && source.titleAwardWoman !== '') {
    return source.titleAwardWoman
  }
  return null
}

/** 目的: 選択済み実績の描画モデルを構築する。副作用: なし。前提: sourceは選択順で渡される。 */
export function buildAchievementRenderItems(
  sources: SelectedAchievementRenderSource[],
  patchDateMap: Map<number, string>,
  disabledBeforeUnlockAccent: boolean,
  characterGender: string | undefined
): AchievementRenderItem[] {
  return sources.map((source) => {
    const completedDateLabel =
      typeof source.completedDate === 'string' && source.completedDate.length > 0
        ? source.completedDate.slice(0, 10)
        : '-'
    const titleAward = resolveTitleAwardByGender(source, characterGender)
    return {
      title: source.achievementTitle,
      completedDateLabel,
      isUnlockedBeforeAdjustment: isUnlockedBeforeAdjustment(
        source.completedDate,
        source.adjustmentPatchId,
        patchDateMap,
        disabledBeforeUnlockAccent
      ),
      titleAwardLabel: titleAward ? `Title: <${titleAward}>` : null,
      itemAwardLabel:
        typeof source.itemAward === 'string' && source.itemAward !== '' ? `Item: ${source.itemAward}` : null,
      itemAwardImageUrl:
        resolveResourceImageUrl(source.itemAwardImageUrl) ??
        resolveResourceImageUrl(source.itemAwardImagePath),
    }
  })
}

/** 目的: ジョブ候補かどうかを判定する。副作用: なし。前提: levelは0以上の数値として扱う。 */
function isJobCandidate(value: Record<string, unknown>): value is Record<string, unknown> & { level: number } {
  return typeof value.level === 'number' && Number.isFinite(value.level) && value.level >= 0
}

/** 目的: ジョブデータを再帰走査して抽出する。副作用: なし。前提: categoryObjectはジョブ階層を持つ任意オブジェクトである。 */
function walkJobTree(
  category: 'battleRoles' | 'crafter' | 'gatherer',
  value: unknown,
  path: string[]
): JobEntry[] {
  if (!isRecord(value)) {
    return []
  }

  const results: JobEntry[] = []
  if (isJobCandidate(value)) {
    const group = category === 'battleRoles' ? path[1] ?? category : category
    const fallbackName = path[path.length - 1] ?? 'Unknown Job'
    const rawName = typeof value.name === 'string' && value.name !== '' ? value.name : fallbackName
    const normalizedName = rawName
      .split('_')
      .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : part))
      .join(' ')
    results.push({
      category,
      group,
      jobName: normalizedName,
      level: Math.trunc(value.level),
    })
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === 'level' || key === 'name') {
      continue
    }
    const childPath = [...path, key]
    results.push(...walkJobTree(category, child, childPath))
  }

  return results
}

/** 目的: characterDataからジョブ一覧を抽出する。副作用: なし。前提: battleRoles/crafter/gathererの構造は可変である。 */
export function extractJobEntries(characterData: Record<string, unknown>): JobEntry[] {
  const categories: Array<'battleRoles' | 'crafter' | 'gatherer'> = ['battleRoles', 'crafter', 'gatherer']
  const entries: JobEntry[] = categories.flatMap((category) =>
    walkJobTree(category, characterData[category], [category])
  )

  const uniqueMap = new Map<string, JobEntry>()
  for (const entry of entries) {
    const key = `${entry.category}:${entry.group}:${entry.jobName}`
    const current = uniqueMap.get(key)
    if (!current || current.level < entry.level) {
      uniqueMap.set(key, entry)
    }
  }

  return [...uniqueMap.values()].sort((a, b) => b.level - a.level)
}

/** 目的: ジョブ一覧から表示行を生成する。副作用: なし。前提: maxLines は1以上を想定する。 */
function buildJobSummaryLines(entries: JobEntry[], maxLines: number): string[] {
  const perLine = 3
  const labels = entries.map((entry) => `${entry.jobName} Lv${entry.level}`)
  const lines: string[] = []

  for (let index = 0; index < labels.length; index += perLine) {
    lines.push(`Jobs: ${labels.slice(index, index + perLine).join(' / ')}`)
    if (lines.length >= maxLines) {
      break
    }
  }

  return lines
}

/** 目的: プレビュー/PNG描画向けの詳細表示行（FC/PvP/ジョブ）を構築する。副作用: なし。前提: sessionLikeはcharacterDataを必ず持つ。 */
export function buildProfileDetailLines(
  sessionLike: CharacterSessionLike,
  maxJobLines: number
): string[] {
  const lines: string[] = []

  const freeCompanyName =
    isRecord(sessionLike.freecompanyInfo) && typeof sessionLike.freecompanyInfo.fcName === 'string'
      ? sessionLike.freecompanyInfo.fcName
      : ''
  if (freeCompanyName !== '') {
    lines.push(`FC: ${freeCompanyName}`)
  }

  const pvpTeamName =
    isRecord(sessionLike.characterData.pvpTeamInfo) &&
    typeof sessionLike.characterData.pvpTeamInfo.name === 'string'
      ? sessionLike.characterData.pvpTeamInfo.name
      : ''
  if (pvpTeamName !== '') {
    lines.push(`PvP: ${pvpTeamName}`)
  }

  const jobs = extractJobEntries(sessionLike.characterData)
  if (jobs.length > 0) {
    lines.push(...buildJobSummaryLines(jobs, Math.max(1, maxJobLines)))
  }

  return lines
}

/** 目的: 設定から実績強調用の色を返す。副作用: なし。前提: 緩和前取得強調時にのみaccentを利用する。 */
export function resolveAchievementTextColor(
  settings: CardEditorSettings,
  isUnlockedBeforeAdjustment: boolean,
  defaultTextColor: string,
  accentColor: string
): string {
  if (isUnlockedBeforeAdjustment && !settings.disabledBeforeUnlockAccent) {
    return accentColor
  }
  return defaultTextColor
}
