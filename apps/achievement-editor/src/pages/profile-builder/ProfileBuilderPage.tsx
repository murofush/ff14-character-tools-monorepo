import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
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
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card'
import { Input } from '../../shared/ui/input'
import { Textarea } from '../../shared/ui/textarea'

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
    <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>自己紹介カード作成</CardTitle>
          <CardDescription>用途に合わせたテンプレートを選び、募集文を最短で作成できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink-subtle)]">
            テンプレート
            <Listbox value={template} onChange={applyTemplate}>
              <div className="relative">
                <ListboxButton className="flex h-11 w-full items-center justify-between rounded-xl border border-[var(--line)] bg-white px-3 text-left">
                  <span>{selectedTemplateLabel}</span>
                  <ChevronDown className="h-4 w-4 text-[var(--ink-subtle)]" />
                </ListboxButton>
                <ListboxOptions className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[var(--line)] bg-white p-1 shadow-lg">
                  {templateOptions.map((option) => (
                    <ListboxOption
                      key={option.key}
                      value={option.key}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[var(--ink)] data-[focus]:bg-[var(--brand-soft)] data-[selected]:font-semibold"
                    >
                      {option.label}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          </label>

          <InputRow label="キャラクター名" value={form.characterName} onChange={(v) => onFieldChange('characterName', v)} />
          <InputRow label="ワールド / DC" value={form.world} onChange={(v) => onFieldChange('world', v)} />
          <InputRow label="メインジョブ" value={form.mainJob} onChange={(v) => onFieldChange('mainJob', v)} />

          <label className="grid gap-2 text-sm font-semibold text-[var(--ink-subtle)]">
            プレイスタイル
            <select
              className="h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              value={form.playStyle}
              onChange={(event) => onFieldChange('playStyle', event.currentTarget.value)}
            >
              {playStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </label>

          <InputRow label="主なプレイ時間" value={form.playTime} onChange={(v) => onFieldChange('playTime', v)} />
          <InputRow label="VC可否（Discordなど）" value={form.voiceChat} onChange={(v) => onFieldChange('voiceChat', v)} />
          <InputRow label="活動内容（零式 / 地図 / ルレなど）" value={form.activity} onChange={(v) => onFieldChange('activity', v)} />
          <TextareaRow label="募集目的" value={form.objective} onChange={(v) => onFieldChange('objective', v)} />
          <TextareaRow label="ひとこと" value={form.appeal} onChange={(v) => onFieldChange('appeal', v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl">プレビュー</CardTitle>
            <Badge>{selectedTemplateLabel}</Badge>
          </div>
          <CardDescription>右側のテキストをそのまま募集文として利用できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="min-h-[320px] whitespace-pre-wrap rounded-2xl border border-[var(--line)] bg-[var(--surface-alt)] p-4 text-sm leading-6">
            {profileText}
          </pre>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" onClick={copyProfile}>
              コピー
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              リセット
            </Button>
          </div>
          {message ? <p className="text-sm font-semibold text-[var(--brand-strong)]">{message}</p> : null}
        </CardContent>
      </Card>
    </section>
  )
}

type ControlProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

/** 目的: 1行テキスト入力を共通表示する。副作用: なし。前提: 親から制御コンポーネントとして値と更新関数を受け取る。 */
function InputRow({ label, value, onChange }: ControlProps): JSX.Element {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--ink-subtle)]">
      {label}
      <Input value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}

/** 目的: 複数行テキスト入力を共通表示する。副作用: なし。前提: 親から制御コンポーネントとして値と更新関数を受け取る。 */
function TextareaRow({ label, value, onChange }: ControlProps): JSX.Element {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--ink-subtle)]">
      {label}
      <Textarea value={value} rows={3} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}
