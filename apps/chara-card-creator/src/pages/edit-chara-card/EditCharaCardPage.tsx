import { Dialog } from '@headlessui/react'
import { ChangeEvent, JSX, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  readCharacterSessionResponse,
  readSelectedAchievementPaths,
} from '../../features/select-achievement/lib/characterSessionStorage'
import { type AchievementIndexPath, type CharacterSessionResponse } from '../../features/select-achievement/model/types'
import {
  FONT_EN_LIST,
  FONT_JP_LIST,
  buildCardLayout,
  buildInfoFontFamily,
  extractCharacterDisplayName,
  extractCharacterMetaLine,
  getDefaultCardEditorSettings,
  resolveActiveCardColor,
  resolveCropRatio,
} from '../../features/edit-chara-card/lib/cardEditorDomain'
import {
  clearCardEditorState,
  createDefaultCardEditorImageState,
  readCardEditorImageState,
  readCardEditorSettings,
  writeCardEditorImageState,
  writeCardEditorSettings,
} from '../../features/edit-chara-card/lib/cardEditorStorage'
import {
  cropImageDataUrl,
  downloadCharaCardPng,
  readFileAsDataUrl,
  renderCardToPngDataUrl,
} from '../../features/edit-chara-card/lib/cardImageProcessing'
import {
  loadSelectedAchievementSummaries,
  type SelectedAchievementSummary,
} from '../../features/edit-chara-card/lib/selectedAchievementSummary'
import { type CardEditorImageState, type CardEditorSettings, type CropFocus } from '../../features/edit-chara-card/model/types'
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card'
import { Input } from '../../shared/ui/input'
import { Textarea } from '../../shared/ui/textarea'

/** 目的: characterDataから自己紹介文の初期値を抽出する。副作用: なし。前提: characterDataはunknownキーを含むオブジェクトである。 */
function extractSelfIntroduction(characterData: Record<string, unknown>): string {
  return typeof characterData.selfintroduction === 'string' ? characterData.selfintroduction : ''
}

/** 目的: 画像表示レイアウトに応じて現在のメイン画像DataURLを返す。副作用: なし。前提: side/fullのどちらかにトリミング済みDataURLが入る。 */
function getCurrentMainImageDataUrl(
  settings: CardEditorSettings,
  imageState: CardEditorImageState
): string | null {
  return settings.isFullSizeImage ? imageState.fullMainImageDataUrl : imageState.sideMainImageDataUrl
}

/** 目的: 編集画面のプレビュー解像度を返す。副作用: なし。前提: 全画面レイアウトは16:9、通常レイアウトは9:16とする。 */
function getPreviewCanvasSize(isFullSizeImage: boolean): { width: number; height: number } {
  return isFullSizeImage ? { width: 1600, height: 900 } : { width: 900, height: 1600 }
}

/** 目的: カード編集画面（旧`/editCharaCard`）の責務をReactで提供する。副作用: localStorage更新・Cloud Storage読込・PNGダウンロードを行う。前提: Homeとselect-achievementのフロー完了後に遷移する。 */
export function EditCharaCardPage(): JSX.Element {
  const navigate = useNavigate()
  const initialSession: CharacterSessionResponse | null = readCharacterSessionResponse()
  const [characterSession] = useState<CharacterSessionResponse | null>(initialSession)
  const [selectedPaths] = useState<AchievementIndexPath[]>(() => readSelectedAchievementPaths())
  const initialDescription: string = extractSelfIntroduction(initialSession?.characterData ?? {})
  const [settings, setSettings] = useState<CardEditorSettings>(() =>
    readCardEditorSettings(initialDescription)
  )
  const [imageState, setImageState] = useState<CardEditorImageState>(() => readCardEditorImageState())
  const [selectedSummaries, setSelectedSummaries] = useState<SelectedAchievementSummary[]>([])
  const [cropSourceDataUrl, setCropSourceDataUrl] = useState<string | null>(null)
  const [cropFocus, setCropFocus] = useState<CropFocus>({ x: 0, y: 0 })
  const [message, setMessage] = useState<string>('')

  const activeCardColor = useMemo(() => resolveActiveCardColor(settings), [settings])
  const currentMainImageDataUrl = useMemo(
    () => getCurrentMainImageDataUrl(settings, imageState),
    [settings, imageState]
  )
  const characterData: Record<string, unknown> = characterSession?.characterData ?? {}
  const characterName: string = extractCharacterDisplayName(characterData)
  const characterMetaLine: string = extractCharacterMetaLine(characterData)
  const infoFontFamily: string = buildInfoFontFamily(settings)

  const previewCanvasSize = getPreviewCanvasSize(settings.isFullSizeImage)
  const previewLayout = useMemo(
    () =>
      buildCardLayout(
        previewCanvasSize.width,
        previewCanvasSize.height,
        settings.isFullSizeImage,
        settings.isImageRight,
        settings.widthSpace
      ),
    [previewCanvasSize.width, previewCanvasSize.height, settings.isFullSizeImage, settings.isImageRight, settings.widthSpace]
  )

  /** 目的: 必須データ欠落時にフロー先頭へ戻す。副作用: ルーティング置換遷移を実行する。前提: 画面表示時点でセッションが存在する。 */
  useEffect((): void => {
    if (!characterSession) {
      navigate('/', { replace: true })
    }
  }, [characterSession, navigate])

  /** 目的: 選択済み実績が無い状態での直アクセスを防ぐ。副作用: `/select-achievement`へ遷移する。前提: 選択導線から来た場合は1件以上選択済みである。 */
  useEffect((): void => {
    if (selectedPaths.length <= 0) {
      navigate('/select-achievement', { replace: true })
    }
  }, [selectedPaths.length, navigate])

  /** 目的: 編集設定を永続化して再訪時の作業再開を可能にする。副作用: localStorage書き込みを行う。前提: settingsはシリアライズ可能な形で保持する。 */
  useEffect((): void => {
    writeCardEditorSettings(settings)
  }, [settings])

  /** 目的: 画像状態を永続化して再訪時の作業再開を可能にする。副作用: localStorage書き込みを行う。前提: DataURL文字列またはnullを保持する。 */
  useEffect((): void => {
    writeCardEditorImageState(imageState)
  }, [imageState])

  /** 目的: 選択済みpathを表示用サマリーへ解決する。副作用: Cloud StorageのカテゴリJSONを遅延取得する。前提: characterSessionとselectedPathsが有効である。 */
  useEffect((): (() => void) | void => {
    if (!characterSession || selectedPaths.length <= 0) {
      setSelectedSummaries([])
      return
    }
    let cancelled = false

    const run = async (): Promise<void> => {
      const summaries = await loadSelectedAchievementSummaries(selectedPaths, characterSession)
      if (!cancelled) {
        setSelectedSummaries(summaries)
      }
    }

    void run()

    return (): void => {
      cancelled = true
    }
  }, [characterSession, selectedPaths])

  /** 目的: 入力変更を共通化して設定更新を簡潔化する。副作用: state更新を行う。前提: updaterは純粋関数として現在値から次値を返す。 */
  const updateSettings = (
    updater: (currentSettings: CardEditorSettings) => CardEditorSettings
  ): void => {
    setSettings((currentSettings) => updater(currentSettings))
  }

  /** 目的: 画像ファイル選択時にDataURLへ変換し、トリミングダイアログを開く。副作用: FileReader実行とstate更新を行う。前提: inputは画像ファイル1件を受け取る。 */
  const handleSelectImageFile = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file: File | undefined = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      setMessage('画像ファイルを選択してください。')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setCropSourceDataUrl(dataUrl)
      setCropFocus({ x: 0, y: 0 })
      setMessage('')
    } catch (error) {
      const reason: string = error instanceof Error ? error.message : String(error)
      setMessage(`画像の読み込みに失敗しました: ${reason}`)
    }
  }

  /** 目的: 現在の比率設定で画像トリミングを適用してメイン画像へ反映する。副作用: canvas描画処理と画像state更新を行う。前提: cropSourceDataUrlが設定済みである。 */
  const handleApplyCrop = async (): Promise<void> => {
    if (!cropSourceDataUrl) {
      return
    }
    try {
      const ratio: number = resolveCropRatio(settings.isFullSizeImage)
      const croppedImageDataUrl: string = await cropImageDataUrl(cropSourceDataUrl, ratio, cropFocus)
      setImageState((currentImageState) => {
        if (settings.isFullSizeImage) {
          return {
            ...currentImageState,
            fullMainImageDataUrl: croppedImageDataUrl,
          }
        }
        return {
          ...currentImageState,
          sideMainImageDataUrl: croppedImageDataUrl,
        }
      })
      setCropSourceDataUrl(null)
      setMessage('画像を適用しました。')
    } catch (error) {
      const reason: string = error instanceof Error ? error.message : String(error)
      setMessage(`トリミングに失敗しました: ${reason}`)
    }
  }

  /** 目的: トリミングダイアログをキャンセルして入力状態を破棄する。副作用: crop関連stateを初期化する。前提: ダイアログ表示中に実行する。 */
  const handleCancelCrop = (): void => {
    setCropSourceDataUrl(null)
    setCropFocus({ x: 0, y: 0 })
  }

  /** 目的: 現在設定からカード画像をレンダリングしPNGを保存する。副作用: canvas描画とブラウザダウンロードを行う。前提: メイン画像が設定済みである。 */
  const handleSavePng = async (): Promise<void> => {
    if (!characterSession) {
      setMessage('キャラクター情報が見つかりません。')
      return
    }
    if (!currentMainImageDataUrl) {
      setMessage('メイン画像を設定してから保存してください。')
      return
    }

    try {
      const pngDataUrl: string = await renderCardToPngDataUrl({
        settings,
        characterName,
        characterMetaLine,
        selectedAchievementTitles: selectedSummaries.map((summary) => summary.achievementTitle),
        mainImageDataUrl: currentMainImageDataUrl,
      })
      downloadCharaCardPng(pngDataUrl)
      setMessage('カード画像を保存しました。')
    } catch (error) {
      const reason: string = error instanceof Error ? error.message : String(error)
      setMessage(`画像保存に失敗しました: ${reason}`)
    }
  }

  /** 目的: 編集状態を初期化して旧フローに合わせて再編集を可能にする。副作用: localStorage削除とstate初期化を行う。前提: 破棄確認なしで即時リセットする。 */
  const handleResetEditorState = (): void => {
    clearCardEditorState()
    setSettings(getDefaultCardEditorSettings(extractSelfIntroduction(characterData)))
    setImageState(createDefaultCardEditorImageState())
    setMessage('編集状態をリセットしました。')
  }

  if (!characterSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Card</CardTitle>
          <CardDescription>キャラクター情報が見つからないためトップへ戻ります。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const infoPanelLeftPercent: string = `${(previewLayout.infoPanelRect.x / previewLayout.canvasWidth) * 100}%`
  const infoPanelWidthPercent: string = `${(previewLayout.infoPanelRect.width / previewLayout.canvasWidth) * 100}%`

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="lg:sticky lg:top-20 lg:h-fit">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Edit Card</CardTitle>
            <Badge variant="subtle">選択済み {selectedPaths.length} / 4</Badge>
          </div>
          <CardDescription>
            画像・紹介文・配色・フォントを調整し、`chara_card.png` を保存できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`relative overflow-hidden rounded-xl border border-[var(--line)] ${
              settings.isFullSizeImage ? 'aspect-video' : 'aspect-[9/16]'
            }`}
            style={{
              backgroundColor: activeCardColor.backgroundColor,
            }}
          >
            {currentMainImageDataUrl ? (
              <img
                src={currentMainImageDataUrl}
                alt="main"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  objectPosition: settings.isImageRight ? 'right center' : 'left center',
                }}
              />
            ) : (
              <div className="absolute inset-0 grid place-content-center bg-slate-200 text-sm text-[var(--ink-subtle)]">
                メイン画像をアップロードしてください
              </div>
            )}

            <div
              className="absolute inset-y-0"
              style={{
                left: infoPanelLeftPercent,
                width: infoPanelWidthPercent,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: activeCardColor.backgroundColor,
                  opacity: settings.isFullSizeImage ? settings.infoBackgroundOpacity : 1,
                }}
              />
              <div className="relative z-10 flex h-full flex-col gap-4 p-4 sm:p-6">
                <h2
                  className="text-2xl"
                  style={{
                    color: activeCardColor.textColor,
                    fontFamily: settings.charaNameFontFamily,
                    fontWeight: settings.nameTextBold ? 700 : 600,
                  }}
                >
                  {characterName}
                </h2>
                <p
                  className="text-sm"
                  style={{
                    color: activeCardColor.textColor,
                    fontFamily: infoFontFamily,
                    fontWeight: settings.infoTextBold ? 700 : 500,
                  }}
                >
                  {characterMetaLine}
                </p>
                <div className="h-[2px] w-full" style={{ backgroundColor: activeCardColor.accentColor }} />
                <p
                  className="whitespace-pre-wrap text-sm"
                  style={{
                    color: activeCardColor.textColor,
                    fontFamily: infoFontFamily,
                    fontWeight: settings.infoTextBold ? 700 : 500,
                  }}
                >
                  {settings.description}
                </p>
                <div className="mt-auto space-y-2">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: activeCardColor.accentColor, fontFamily: infoFontFamily }}
                  >
                    Selected Achievements
                  </p>
                  <ol
                    className="space-y-1 text-xs"
                    style={{
                      color: activeCardColor.textColor,
                      fontFamily: infoFontFamily,
                      fontWeight: settings.infoTextBold ? 700 : 500,
                    }}
                  >
                    {selectedSummaries.length <= 0 ? (
                      <li>選択済み実績を読み込み中です。</li>
                    ) : (
                      selectedSummaries.map((summary) => (
                        <li key={`${summary.path.kindIndex}-${summary.path.categoryIndex}-${summary.path.groupIndex}-${summary.path.achievementIndex}`}>
                          {summary.achievementTitle}
                        </li>
                      ))
                    )}
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/select-achievement')}>
              アチーブメント選択
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/')}>
              キャラクター選択
            </Button>
            <Button type="button" onClick={() => void handleSavePng()}>
              画像を保存
            </Button>
          </div>
          {message !== '' ? <p className="text-sm font-semibold text-[var(--danger)]">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>旧実装の責務に合わせて、画像・表示・配色・フォント設定を編集します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">メイン画像</p>
            <Input type="file" accept="image/*" onChange={(event) => void handleSelectImageFile(event)} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={settings.isFullSizeImage ? 'secondary' : 'default'}
                size="sm"
                onClick={() => updateSettings((currentSettings) => ({ ...currentSettings, isFullSizeImage: false }))}
              >
                9:16
              </Button>
              <Button
                type="button"
                variant={settings.isFullSizeImage ? 'default' : 'secondary'}
                size="sm"
                onClick={() => updateSettings((currentSettings) => ({ ...currentSettings, isFullSizeImage: true }))}
              >
                16:9
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.isImageRight}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    isImageRight: event.target.checked,
                  }))
                }
              />
              画像を右側に寄せる
            </label>
            <label className="grid gap-1 text-sm">
              メイン画像表示範囲（16:9時）
              <Input
                type="range"
                min={0}
                max={100}
                value={settings.widthSpace}
                disabled={!settings.isFullSizeImage}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    widthSpace: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label className="grid gap-1 text-sm">
              情報領域透過度（16:9時）
              <Input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.infoBackgroundOpacity}
                disabled={!settings.isFullSizeImage}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    infoBackgroundOpacity: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">紹介文</p>
            <Textarea
              value={settings.description}
              rows={5}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                updateSettings((currentSettings) => ({
                  ...currentSettings,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">テーマ</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={settings.theme === 'light' ? 'default' : 'secondary'}
                onClick={() => updateSettings((currentSettings) => ({ ...currentSettings, theme: 'light' }))}
              >
                Light
              </Button>
              <Button
                type="button"
                size="sm"
                variant={settings.theme === 'dark' ? 'default' : 'secondary'}
                onClick={() => updateSettings((currentSettings) => ({ ...currentSettings, theme: 'dark' }))}
              >
                Dark
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.isCardColorChangeable}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    isCardColorChangeable: event.target.checked,
                  }))
                }
              />
              配色を個別指定する
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="grid gap-1 text-xs">
                文字色
                <Input
                  type="color"
                  value={settings.cardColor.textColor}
                  disabled={!settings.isCardColorChangeable}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateSettings((currentSettings) => ({
                      ...currentSettings,
                      cardColor: {
                        ...currentSettings.cardColor,
                        textColor: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className="grid gap-1 text-xs">
                背景色
                <Input
                  type="color"
                  value={settings.cardColor.backgroundColor}
                  disabled={!settings.isCardColorChangeable}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateSettings((currentSettings) => ({
                      ...currentSettings,
                      cardColor: {
                        ...currentSettings.cardColor,
                        backgroundColor: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className="grid gap-1 text-xs">
                強調色
                <Input
                  type="color"
                  value={settings.cardColor.accentColor}
                  disabled={!settings.isCardColorChangeable}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateSettings((currentSettings) => ({
                      ...currentSettings,
                      cardColor: {
                        ...currentSettings.cardColor,
                        accentColor: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">フォント</p>
            <label className="grid gap-1 text-sm">
              キャラクター名
              <select
                className="h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                value={settings.charaNameFontFamily}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    charaNameFontFamily: event.target.value,
                  }))
                }
              >
                {FONT_JP_LIST.map((fontName) => (
                  <option key={fontName} value={fontName}>
                    {fontName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              全体（JP）
              <select
                className="h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                value={settings.charaInfoFontFamilyJP}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    charaInfoFontFamilyJP: event.target.value,
                  }))
                }
              >
                {FONT_JP_LIST.map((fontName) => (
                  <option key={fontName} value={fontName}>
                    {fontName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.charaInfoFontFamilyENEnabled}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    charaInfoFontFamilyENEnabled: event.target.checked,
                  }))
                }
              />
              英数字専用フォントを使う
            </label>
            <label className="grid gap-1 text-sm">
              英数字フォント
              <select
                className="h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                value={settings.charaInfoFontFamilyEN ?? ''}
                disabled={!settings.charaInfoFontFamilyENEnabled}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    charaInfoFontFamilyEN: event.target.value === '' ? null : event.target.value,
                  }))
                }
              >
                <option value="">未設定</option>
                {FONT_EN_LIST.map((fontName) => (
                  <option key={fontName} value={fontName}>
                    {fontName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.nameTextBold}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    nameTextBold: event.target.checked,
                  }))
                }
              />
              キャラクター名を太字
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.infoTextBold}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    infoTextBold: event.target.checked,
                  }))
                }
              />
              全体テキストを太字
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.disabledBeforeUnlockAccent}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateSettings((currentSettings) => ({
                    ...currentSettings,
                    disabledBeforeUnlockAccent: event.target.checked,
                  }))
                }
              />
              緩和前取得時の強調表示を無効化
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleResetEditorState}>
              編集状態をリセット
            </Button>
            <Button type="button" onClick={() => void handleSavePng()}>
              画像を保存
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={cropSourceDataUrl !== null} onClose={handleCancelCrop} className="relative z-50">
        <div className="fixed inset-0 bg-black/35" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xl">
            <Dialog.Title className="text-lg font-semibold">画像トリミング</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[var(--ink-subtle)]">
              現在のレイアウト比率（{settings.isFullSizeImage ? '16:9' : '9:16'}）で切り抜いて適用します。
            </Dialog.Description>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-slate-50 p-2">
                {cropSourceDataUrl ? (
                  <img src={cropSourceDataUrl} alt="crop source" className="h-[56vh] w-full object-contain" />
                ) : null}
              </div>
              <div className="space-y-3">
                <label className="grid gap-1 text-sm">
                  水平フォーカス
                  <Input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={cropFocus.x}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setCropFocus((currentFocus) => ({
                        ...currentFocus,
                        x: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  垂直フォーカス
                  <Input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={cropFocus.y}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setCropFocus((currentFocus) => ({
                        ...currentFocus,
                        y: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={handleCancelCrop}>
                    キャンセル
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => void handleApplyCrop()}>
                    適用
                  </Button>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </section>
  )
}
