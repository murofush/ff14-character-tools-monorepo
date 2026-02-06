import { FormEvent, useMemo, useState } from 'react'
import {
  buildProfileText,
  createInitialForm,
  playStyles,
  templateOptions,
  templateValues,
  TemplateKey,
} from '../lib/profileTemplates'

export function ProfileBuilderPage() {
  const [template, setTemplate] = useState<TemplateKey>('fixed')
  const [form, setForm] = useState(createInitialForm)
  const [message, setMessage] = useState('')

  const selectedTemplateLabel =
    templateOptions.find((option) => option.key === template)?.label ?? ''

  const profileText = useMemo(
    () => buildProfileText(selectedTemplateLabel, form),
    [form, selectedTemplateLabel]
  )

  const applyTemplate = (nextTemplate: TemplateKey) => {
    setTemplate(nextTemplate)
    setForm((current) => ({ ...current, ...templateValues[nextTemplate] }))
  }

  const resetForm = () => {
    const base = createInitialForm()
    setForm({ ...base, ...templateValues[template] })
    setMessage('フォームをリセットしました。')
  }

  const copyProfile = async () => {
    if (!navigator.clipboard) {
      setMessage('この環境ではコピー機能を利用できません。')
      return
    }

    await navigator.clipboard.writeText(profileText)
    setMessage('自己紹介文をコピーしました。')
  }

  const onTemplateChange = (event: FormEvent<HTMLSelectElement>) => {
    applyTemplate(event.currentTarget.value as TemplateKey)
  }

  const onFieldChange = (key: keyof typeof form, value: string) => {
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

function Input({ label, value, onChange }: ControlProps) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}

function Textarea({ label, value, onChange }: ControlProps) {
  return (
    <label>
      {label}
      <textarea value={value} rows={3} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}
