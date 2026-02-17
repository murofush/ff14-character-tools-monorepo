import { type PatchDefinition } from './cardRenderDomain'

const DEFAULT_CLOUD_STORAGE_BASE_URL = 'https://forfan-resource.storage.googleapis.com'
const PATCH_DEFINITION_PATH = 'patch/patch.json'

type DataSourceOptions = {
  cloudStorageBaseUrl?: string
  fetcher?: typeof fetch
}

/** 目的: unknown値がRecord型か判定する。副作用: なし。前提: JSON.parse済み値を受け取る。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

/** 目的: Cloud Storage絶対URLを組み立てる。副作用: なし。前提: baseUrlは末尾スラッシュ有無を許容する。 */
function buildCloudStorageUrl(baseUrl: string, relativePath: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  return `${normalizedBaseUrl}/${relativePath}`
}

/** 目的: rawパッチ定義をPatchDefinitionへ正規化する。副作用: なし。前提: idは整数であることを要求する。 */
function normalizePatchDefinition(rawValue: unknown): PatchDefinition | null {
  if (!isRecord(rawValue)) {
    return null
  }
  const id = rawValue.id
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    return null
  }
  const date = typeof rawValue.date === 'string' ? rawValue.date : undefined
  return {
    ...rawValue,
    id,
    date,
  }
}

/** 目的: patch定義をCloud Storageから取得する。副作用: HTTP GETを実行する。前提: `patch/patch.json` が公開読取可能である。 */
export async function loadPatchDefinitions(
  options: DataSourceOptions = {}
): Promise<PatchDefinition[]> {
  const fetcher = options.fetcher ?? fetch
  const cloudStorageBaseUrl = options.cloudStorageBaseUrl ?? DEFAULT_CLOUD_STORAGE_BASE_URL
  const response = await fetcher(buildCloudStorageUrl(cloudStorageBaseUrl, PATCH_DEFINITION_PATH))
  if (!response.ok) {
    throw new Error(`failed to fetch patch definitions: status=${response.status}`)
  }
  const payload = (await response.json()) as unknown
  if (!Array.isArray(payload)) {
    throw new Error('invalid patch definitions: array is required')
  }
  return payload
    .map((rawValue) => normalizePatchDefinition(rawValue))
    .filter((patch): patch is PatchDefinition => patch !== null)
}
