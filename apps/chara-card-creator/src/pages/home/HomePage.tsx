import { ChangeEvent, FormEvent, JSX, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeLodestoneInput } from '../../features/home/lodestoneInput'
import {
  type RecentCharacterSummary,
  readRecentCharacterSummary,
  writeRecentCharacterSummary,
} from '../../features/home/recentCharacterStorage'
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
  const [recentCharacter, setRecentCharacter] = useState<RecentCharacterSummary | null>(
    () => readRecentCharacterSummary()
  )

  /** 目的: 入力値を状態へ反映し、バリデーションエラーを再入力時に解除する。副作用: state更新を行う。前提: Lodestone入力欄のchangeイベント。 */
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(event.target.value)
    if (errorMessage !== '') {
      setErrorMessage('')
    }
  }

  /** 目的: 入力検証と正規化を行い、最新入力キャラクターを保存して次画面へ進める。副作用: localStorage更新・state更新・ルーティング遷移。前提: form submitイベント。 */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const normalized = normalizeLodestoneInput(inputValue)
    if (!normalized.ok) {
      if (normalized.error === 'required') {
        setErrorMessage('URLは必須です。')
      } else {
        setErrorMessage(lodestoneInputHint)
      }
      return
    }

    const summary: RecentCharacterSummary = {
      ...normalized.value,
      fetchedAt: new Date().toISOString(),
    }
    writeRecentCharacterSummary(summary)
    setRecentCharacter(summary)
    setErrorMessage('')
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
    <PageCard title="Home" description="Lodestone URL/IDの入力導線をReact側へ段階移行しました。">
      <section className="home-section">
        <h3>新規のキャラクターから名刺を作成</h3>
        <form onSubmit={handleSubmit} className="home-form">
          <label htmlFor="lodestone-url" className="home-label">
            Lodestone URL / Character ID
          </label>
          <input
            id="lodestone-url"
            className="home-input"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={lodestoneInputHint}
            autoComplete="off"
          />
          <p className="home-hint">{lodestoneInputHint}</p>
          {errorMessage !== '' ? <p className="home-error">{errorMessage}</p> : null}
          <div className="home-actions">
            <button type="button" className="home-button home-button-secondary" onClick={handleClickHowTo}>
              つかいかた
            </button>
            <button type="submit" className="home-button">
              取得
            </button>
          </div>
        </form>
      </section>

      {recentCharacter ? (
        <section className="home-section">
          <h3>最新の入力済みキャラクターから名刺を作成</h3>
          <button
            type="button"
            className="recent-card"
            onClick={handleSelectRecentCharacter}
            aria-label="最新入力キャラクターを選択"
          >
            <p className="recent-card-name">Character ID: {recentCharacter.characterId}</p>
            <p className="recent-card-sub">最終入力日: {formatDateText(recentCharacter.fetchedAt)}</p>
          </button>
        </section>
      ) : null}

      <section id="how-to" className="home-section">
        <h3>つかいかた</h3>
        <ol className="home-howto-list">
          <li>Lodestone のキャラクターページURL、または Character ID を入力します。</li>
          <li>「取得」を押して入力内容を正規化し、次画面へ進みます。</li>
        </ol>
      </section>

      <img src="/img/home.png" alt="home" className="hero" />
    </PageCard>
  )
}
