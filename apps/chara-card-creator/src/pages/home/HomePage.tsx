import { ChangeEvent, FormEvent, JSX, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCharacterInfoFromBackend } from '../../features/home/fetchCharacterInfo'
import { normalizeLodestoneInput } from '../../features/home/lodestoneInput'
import {
  type RecentCharacterSummary,
  readRecentCharacterSummary,
  writeRecentCharacterSummary,
} from '../../features/home/recentCharacterStorage'
import {
  clearSelectedAchievementPaths,
  readCharacterSessionResponse,
  writeCharacterSessionResponse,
} from '../../features/select-achievement/lib/characterSessionStorage'
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Input } from '../../shared/ui/input'
import { PageCard } from '../../shared/ui/PageCard'

const lodestoneInputHint =
  'https://jp.finalfantasyxiv.com/lodestone/character/[character-id] のURL、または [character-id] を入力してください。'

/** 目的: 日付表示を「yyyy/mm/dd」に揃えて最新入力カードで見やすくする。副作用: なし。前提: `isoDate` はISO形式文字列。 */
function formatDateText(isoDate: string): string {
  const date = new Date(isoDate)
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/** 目的: Home画面で旧Nuxtの入力導線をReactで提供する。副作用: localStorage更新と画面遷移を行う。前提: React Router配下で描画される。 */
export function HomePage(): JSX.Element {
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [fetchProcessMessages, setFetchProcessMessages] = useState<string[]>([])
  const [recentCharacter, setRecentCharacter] = useState<RecentCharacterSummary | null>(
    () => readRecentCharacterSummary()
  )
  const backendBaseUrl =
    (import.meta.env.VITE_CHARA_BACKEND_BASE_URL as string | undefined) ?? ''

  /** 目的: 取得プロセス表示へ新しいメッセージを追記し、画面から現在処理を追えるようにする。副作用: state更新を行う。前提: `message` はユーザー表示可能な文言。 */
  const appendFetchProcessMessage = (message: string): void => {
    setFetchProcessMessages((previousMessages) => [...previousMessages, message])
  }

  /** 目的: 入力値を状態へ反映し、再入力時にエラーと前回プロセス表示を解除する。副作用: state更新を行う。前提: Lodestone入力欄のchangeイベント。 */
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(event.target.value)
    if (errorMessage !== '') {
      setErrorMessage('')
    }
    if (!isFetching && fetchProcessMessages.length > 0) {
      setFetchProcessMessages([])
    }
  }

  /** 目的: 入力検証後にbackendからキャラクター情報を取得し、最新入力キャラクターを保存して次画面へ進める。副作用: HTTP通信・localStorage更新・state更新・ルーティング遷移。前提: form submitイベント。 */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setFetchProcessMessages(['入力値を検証しています。'])
    const normalized = normalizeLodestoneInput(inputValue)
    if (!normalized.ok) {
      if (normalized.error === 'required') {
        setErrorMessage('URLは必須です。')
      } else {
        setErrorMessage(lodestoneInputHint)
      }
      return
    }

    setIsFetching(true)
    appendFetchProcessMessage('キャラクター情報の取得を開始します。')
    const fetchedCharacter = await fetchCharacterInfoFromBackend(normalized.value.profileUrl, {
      backendBaseUrl,
      onProgress: appendFetchProcessMessage,
    })
    if (!fetchedCharacter.ok) {
      appendFetchProcessMessage('キャラクター情報の取得に失敗しました。')
      setErrorMessage(fetchedCharacter.message)
      setIsFetching(false)
      return
    }

    appendFetchProcessMessage('取得結果を作業セッションへ保存しています。')
    const previousCharacterSession = readCharacterSessionResponse()
    writeCharacterSessionResponse(fetchedCharacter.value)
    if (
      previousCharacterSession &&
      previousCharacterSession.characterID !== fetchedCharacter.value.characterID
    ) {
      appendFetchProcessMessage('キャラクターが変更されたため選択済み実績を初期化しています。')
      clearSelectedAchievementPaths()
    }

    const characterId = String(fetchedCharacter.value.characterID)
    const summary: RecentCharacterSummary = {
      characterId,
      profileUrl: `https://jp.finalfantasyxiv.com/lodestone/character/${characterId}`,
      fetchedAt: new Date().toISOString(),
    }
    appendFetchProcessMessage('最新入力キャラクター情報を保存しています。')
    writeRecentCharacterSummary(summary)
    setRecentCharacter(summary)
    setErrorMessage('')
    setIsFetching(false)
    appendFetchProcessMessage('実績選択画面へ遷移します。')
    navigate('/select-achievement')
  }

  /** 目的: 「つかいかた」節へスクロールし、旧画面のヘルプ導線を維持する。副作用: ブラウザのスクロール位置を変更する。前提: `how-to` 要素が存在する。 */
  const handleClickHowTo = (): void => {
    document.getElementById('how-to')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  /** 目的: 保存済みの最新入力キャラクターから次画面へ再遷移できるようにする。副作用: ルーティング遷移を行う。前提: 遷移先ルートが存在する。 */
  const handleSelectRecentCharacter = (): void => {
    navigate('/select-achievement')
  }

  return (
    <PageCard title="Home" description="旧Vue導線の入力フローを現行画面へ移行しました。">
      <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-white/85 p-5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl font-bold">新規のキャラクターから名刺を作成</h3>
          <Badge variant="subtle">Step 1</Badge>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <label htmlFor="lodestone-url" className="text-sm font-semibold text-[var(--ink-subtle)]">
            Lodestone URL / Character ID
          </label>
          <Input id="lodestone-url" value={inputValue} onChange={handleInputChange} placeholder={lodestoneInputHint} autoComplete="off" />
          <p className="text-sm text-[var(--ink-subtle)]">{lodestoneInputHint}</p>
          {errorMessage !== '' ? <p className="text-sm font-semibold text-[var(--danger)]">{errorMessage}</p> : null}
          {fetchProcessMessages.length > 0 ? (
            <section
              aria-live="polite"
              className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-alt)]/60 p-3"
            >
              <p className="text-sm font-semibold text-[var(--ink-subtle)]">
                取得プロセス: {fetchProcessMessages[fetchProcessMessages.length - 1]}
              </p>
              <ol className="space-y-1 text-xs text-[var(--ink-subtle)]">
                {fetchProcessMessages.map((message, index) => (
                  <li key={`${index}-${message}`} className="leading-5">
                    {index + 1}. {message}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClickHowTo}>
              つかいかた
            </Button>
            <Button type="submit" disabled={isFetching}>
              {isFetching ? '取得中...' : '取得'}
            </Button>
          </div>
        </form>
      </section>

      {recentCharacter ? (
        <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white/85 p-5">
          <h3 className="font-display text-xl font-bold">最新の入力済みキャラクターから名刺を作成</h3>
          <button
            type="button"
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-alt)] p-4 text-left transition hover:border-[var(--brand)]"
            onClick={handleSelectRecentCharacter}
            aria-label="最新入力キャラクターを選択"
          >
            <p className="text-base font-semibold">Character ID: {recentCharacter.characterId}</p>
            <p className="text-sm text-[var(--ink-subtle)]">最終入力日: {formatDateText(recentCharacter.fetchedAt)}</p>
          </button>
        </section>
      ) : null}

      <section id="how-to" className="space-y-3 rounded-2xl border border-[var(--line)] bg-white/85 p-5">
        <h3 className="font-display text-xl font-bold">つかいかた</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-[var(--ink-subtle)]">
          <li>Lodestone のキャラクターページURL、または Character ID を入力します。</li>
          <li>「取得」を押して入力内容を正規化し、次画面へ進みます。</li>
        </ol>
      </section>

      <img src="/img/home.png" alt="home" className="w-full rounded-2xl border border-[var(--line)] object-cover shadow-[0_16px_40px_rgba(31,47,74,0.12)]" />
    </PageCard>
  )
}
