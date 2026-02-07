import { ChangeEvent, JSX, useMemo, useState } from 'react'
import {
  type ProfileForm,
  type TemplateKey,
  buildProfileText,
  createInitialForm,
  playStyles,
  templateOptions,
  templateValues,
} from '../../features/profile-builder/lib/profileTemplates'

/** 目的: selectの生文字列をTemplateKeyへ安全に変換する。副作用: なし。前提: 候補は`templateOptions`で管理される。 */
function toTemplateKey(rawValue: string): TemplateKey {
  const foundOption = templateOptions.find((option) => option.key === rawValue)
  return foundOption?.key ?? 'fixed'
}

/** 目的: 自己紹介テンプレート編集・プレビュー・コピー機能を提供する。副作用: クリップボード書き込みを行う。前提: ルート`/profile-builder`で表示される。 */
export function ProfileBuilderPage(): JSX.Element {
  const [template, setTemplate] = useState<TemplateKey>('fixed')
  const [form, setForm] = useState<ProfileForm>(createInitialForm)
  const [message, setMessage] = useState<string>('')

  const selectedTemplateLabel: string =
    templateOptions.find((option) => option.key === template)?.label ?? ''

  const profileText: string = useMemo(
    () => buildProfileText(selectedTemplateLabel, form),
    [form, selectedTemplateLabel]
  )

  /** 目的: テンプレート切り替え時に推奨初期値をフォームへ適用する。副作用: React stateを更新する。前提: `nextTemplate` は有効なTemplateKey。 */
  const applyTemplate = (nextTemplate: TemplateKey): void => {
    setTemplate(nextTemplate)
    setForm((current) => ({ ...current, ...templateValues[nextTemplate] }))
  }

  /** 目的: 現在選択中テンプレートに基づきフォームを初期化する。副作用: React stateを更新する。前提: `template` が定義済みである。 */
  const resetForm = (): void => {
    const base = createInitialForm()
    setForm({ ...base, ...templateValues[template] })
    setMessage('フォームをリセットしました。')
  }

  /** 目的: 生成済み自己紹介文をクリップボードへコピーする。副作用: クリップボード書き込みとメッセージ更新を行う。前提: `navigator.clipboard` が利用可能である。 */
  const copyProfile = async (): Promise<void> => {
    if (!navigator.clipboard) {
      setMessage('この環境ではコピー機能を利用できません。')
      return
    }

    await navigator.clipboard.writeText(profileText)
    setMessage('自己紹介文をコピーしました。')
  }

  /** 目的: テンプレート選択UIの変更を状態に反映する。副作用: React stateを更新する。前提: select要素のchangeイベントである。 */
  const onTemplateChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    applyTemplate(toTemplateKey(event.currentTarget.value))
  }

  /** 目的: 任意フィールドの入力値をフォーム状態へ反映する。副作用: React stateを更新する。前提: `key` はProfileFormのキーである。 */
  const onFieldChange = (key: keyof ProfileForm, value: string): void => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="builder-grid">
      <div className="card form-card">
        <h2>自己紹介カード作成</h2>
        <p className="sub">用途に合わせたテンプレートを選び、募集文を最短で作成できます。</p>

        <label>
          テンプレート
          <select value={template} onChange={onTemplateChange}>
            {templateOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <Input label="キャラクター名" value={form.characterName} onChange={(v) => onFieldChange('characterName', v)} />
        <Input label="ワールド / DC" value={form.world} onChange={(v) => onFieldChange('world', v)} />
        <Input label="メインジョブ" value={form.mainJob} onChange={(v) => onFieldChange('mainJob', v)} />

        <label>
          プレイスタイル
          <select value={form.playStyle} onChange={(event) => onFieldChange('playStyle', event.currentTarget.value)}>
            {playStyles.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </label>

        <Input label="主なプレイ時間" value={form.playTime} onChange={(v) => onFieldChange('playTime', v)} />
        <Input label="VC可否（Discordなど）" value={form.voiceChat} onChange={(v) => onFieldChange('voiceChat', v)} />
        <Input label="活動内容（零式 / 地図 / ルレなど）" value={form.activity} onChange={(v) => onFieldChange('activity', v)} />
        <Textarea label="募集目的" value={form.objective} onChange={(v) => onFieldChange('objective', v)} />
        <Textarea label="ひとこと" value={form.appeal} onChange={(v) => onFieldChange('appeal', v)} />
      </div>

      <div className="card preview-card">
        <div className="preview-header">
          <h3>プレビュー</h3>
          <span className="badge">{selectedTemplateLabel}</span>
        </div>
        <pre>{profileText}</pre>
        <div className="actions">
          <button type="button" className="button" onClick={copyProfile}>
            コピー
          </button>
          <button type="button" className="button secondary" onClick={resetForm}>
            リセット
          </button>
        </div>
        {message ? <p className="message">{message}</p> : null}
      </div>
    </section>
  )
}

type ControlProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

/** 目的: 1行テキスト入力を共通表示する。副作用: なし。前提: 親から制御コンポーネントとして値と更新関数を受け取る。 */
function Input({ label, value, onChange }: ControlProps): JSX.Element {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}

/** 目的: 複数行テキスト入力を共通表示する。副作用: なし。前提: 親から制御コンポーネントとして値と更新関数を受け取る。 */
function Textarea({ label, value, onChange }: ControlProps): JSX.Element {
  return (
    <label>
      {label}
      <textarea value={value} rows={3} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}
