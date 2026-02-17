import {
  buildCardLayout,
  buildInfoFontFamily,
  calculateCropRect,
  clamp,
  resolveActiveCardColor,
} from './cardEditorDomain'
import {
  type CardEditorSettings,
  type CropFocus,
} from '../model/types'

const OUTPUT_FILE_NAME = 'chara_card.png'

type RenderCardToPngArg = {
  settings: CardEditorSettings
  characterName: string
  characterMetaLine: string
  selectedAchievementTitles: string[]
  mainImageDataUrl: string | null
}

/** 目的: DataURL文字列からHTMLImageElementを読み込む。副作用: ブラウザの画像デコードを実行する。前提: sourceDataUrlは有効な画像DataURLである。 */
export function loadImageFromDataUrl(sourceDataUrl: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image: HTMLImageElement = new Image()
    image.onload = (): void => {
      resolve(image)
    }
    image.onerror = (): void => {
      reject(new Error('画像の読み込みに失敗しました。'))
    }
    image.src = sourceDataUrl
  })
}

/** 目的: FileオブジェクトをDataURLへ変換する。副作用: FileReaderを実行する。前提: input type=file で選択された画像ファイルを受け取る。 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader: FileReader = new FileReader()
    reader.onload = (): void => {
      if (typeof reader.result !== 'string') {
        reject(new Error('画像ファイルの読み込み結果が不正です。'))
        return
      }
      resolve(reader.result)
    }
    reader.onerror = (): void => {
      reject(new Error('画像ファイルの読み込みに失敗しました。'))
    }
    reader.readAsDataURL(file)
  })
}

/** 目的: 指定比率で画像を切り抜いてDataURLを返す。副作用: オフスクリーンcanvasで描画を行う。前提: sourceDataUrlはブラウザで読み込み可能な画像である。 */
export async function cropImageDataUrl(
  sourceDataUrl: string,
  targetRatio: number,
  focus: CropFocus
): Promise<string> {
  const image: HTMLImageElement = await loadImageFromDataUrl(sourceDataUrl)
  const cropRect = calculateCropRect(image.width, image.height, targetRatio, focus)
  const canvas: HTMLCanvasElement = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(cropRect.sourceWidth))
  canvas.height = Math.max(1, Math.round(cropRect.sourceHeight))
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvasコンテキストの初期化に失敗しました。')
  }
  context.drawImage(
    image,
    cropRect.sourceX,
    cropRect.sourceY,
    cropRect.sourceWidth,
    cropRect.sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return canvas.toDataURL('image/png')
}

/** 目的: 16進カラー文字列をRGBA文字列へ変換する。副作用: なし。前提: `#RRGGBB` 形式以外はそのまま返す。 */
function convertHexToRgba(color: string, opacity: number): string {
  const normalizedOpacity: number = clamp(opacity, 0, 1)
  const hex: string = color.startsWith('#') ? color.slice(1) : color
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return color
  }
  const red: number = Number.parseInt(hex.slice(0, 2), 16)
  const green: number = Number.parseInt(hex.slice(2, 4), 16)
  const blue: number = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${normalizedOpacity})`
}

/** 目的: 指定領域を覆うように画像を描画する。副作用: Canvas描画を実行する。前提: contextは有効な2Dコンテキストである。 */
function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  destinationX: number,
  destinationY: number,
  destinationWidth: number,
  destinationHeight: number,
  isImageRight: boolean
): void {
  const destinationRatio: number = destinationWidth / destinationHeight
  const sourceRatio: number = image.width / image.height

  if (sourceRatio > destinationRatio) {
    const sourceHeight: number = image.height
    const sourceWidth: number = sourceHeight * destinationRatio
    const sourceX: number = isImageRight ? image.width - sourceWidth : 0
    context.drawImage(
      image,
      sourceX,
      0,
      sourceWidth,
      sourceHeight,
      destinationX,
      destinationY,
      destinationWidth,
      destinationHeight
    )
    return
  }

  const sourceWidth: number = image.width
  const sourceHeight: number = sourceWidth / destinationRatio
  const sourceY: number = (image.height - sourceHeight) / 2
  context.drawImage(
    image,
    0,
    sourceY,
    sourceWidth,
    sourceHeight,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight
  )
}

/** 目的: 複数行テキストを指定幅で折り返して描画し、次の描画Y座標を返す。副作用: Canvasへテキスト描画を行う。前提: context.fontが事前設定済みである。 */
function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLineCount: number
): number {
  const lines: string[] = []
  const sourceLines: string[] = text.split(/\r?\n/)

  for (const sourceLine of sourceLines) {
    let current: string = ''
    for (const character of sourceLine) {
      const next: string = `${current}${character}`
      if (context.measureText(next).width > maxWidth && current !== '') {
        lines.push(current)
        current = character
      } else {
        current = next
      }
      if (lines.length >= maxLineCount) {
        break
      }
    }
    if (lines.length >= maxLineCount) {
      break
    }
    lines.push(current)
    if (lines.length >= maxLineCount) {
      break
    }
  }

  let currentY: number = y
  for (const [index, line] of lines.entries()) {
    const isLastLine: boolean = index === maxLineCount - 1
    const overflowed: boolean = lines.length > maxLineCount
    const outputLine: string = isLastLine && overflowed ? `${line}...` : line
    context.fillText(outputLine, x, currentY)
    currentY += lineHeight
  }
  return currentY
}

/** 目的: 現在の編集状態からカード画像をレンダリングしてPNG DataURLを返す。副作用: オフスクリーンcanvas描画を実行する。前提: documentが利用可能なブラウザ環境で実行する。 */
export async function renderCardToPngDataUrl(arg: RenderCardToPngArg): Promise<string> {
  const canvasWidth: number = arg.settings.isFullSizeImage ? 1600 : 900
  const canvasHeight: number = arg.settings.isFullSizeImage ? 900 : 1600
  const layout = buildCardLayout(
    canvasWidth,
    canvasHeight,
    arg.settings.isFullSizeImage,
    arg.settings.isImageRight,
    arg.settings.widthSpace
  )
  const activeCardColor = resolveActiveCardColor(arg.settings)

  const canvas: HTMLCanvasElement = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvasコンテキストの初期化に失敗しました。')
  }

  context.fillStyle = activeCardColor.backgroundColor
  context.fillRect(0, 0, canvasWidth, canvasHeight)

  if (arg.mainImageDataUrl) {
    const mainImage: HTMLImageElement = await loadImageFromDataUrl(arg.mainImageDataUrl)
    drawImageCover(
      context,
      mainImage,
      layout.mainImageRect.x,
      layout.mainImageRect.y,
      layout.mainImageRect.width,
      layout.mainImageRect.height,
      arg.settings.isImageRight
    )
  }

  const panelColor: string = convertHexToRgba(
    activeCardColor.backgroundColor,
    arg.settings.isFullSizeImage ? arg.settings.infoBackgroundOpacity : 1
  )
  context.fillStyle = panelColor
  context.fillRect(
    layout.infoPanelRect.x,
    layout.infoPanelRect.y,
    layout.infoPanelRect.width,
    layout.infoPanelRect.height
  )

  const contentMargin: number = 48
  const contentX: number = layout.infoPanelRect.x + contentMargin
  const contentWidth: number = layout.infoPanelRect.width - contentMargin * 2
  let currentY: number = 90

  context.fillStyle = activeCardColor.accentColor
  context.fillRect(contentX, currentY - 28, contentWidth, 8)

  context.fillStyle = activeCardColor.textColor
  context.font = `${arg.settings.nameTextBold ? '700' : '600'} 68px "${arg.settings.charaNameFontFamily}", sans-serif`
  currentY = drawWrappedText(context, arg.characterName, contentX, currentY, contentWidth, 72, 2)

  context.font = `${arg.settings.infoTextBold ? '700' : '500'} 30px "${buildInfoFontFamily(arg.settings)}", sans-serif`
  currentY += 16
  currentY = drawWrappedText(context, arg.characterMetaLine, contentX, currentY, contentWidth, 38, 2)

  currentY += 18
  context.strokeStyle = activeCardColor.accentColor
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(contentX, currentY)
  context.lineTo(contentX + contentWidth, currentY)
  context.stroke()

  currentY += 44
  context.font = `${arg.settings.infoTextBold ? '700' : '500'} 30px "${buildInfoFontFamily(arg.settings)}", sans-serif`
  currentY = drawWrappedText(context, arg.settings.description, contentX, currentY, contentWidth, 40, 6)

  currentY += 24
  context.fillStyle = activeCardColor.accentColor
  context.font = `${arg.settings.infoTextBold ? '700' : '600'} 28px "${buildInfoFontFamily(arg.settings)}", sans-serif`
  context.fillText('Selected Achievements', contentX, currentY)

  context.fillStyle = activeCardColor.textColor
  context.font = `${arg.settings.infoTextBold ? '700' : '500'} 24px "${buildInfoFontFamily(arg.settings)}", sans-serif`
  let achievementY: number = currentY + 40
  for (const [index, title] of arg.selectedAchievementTitles.slice(0, 4).entries()) {
    const label: string = `${index + 1}. ${title}`
    context.fillText(label, contentX, achievementY)
    achievementY += 34
  }

  return canvas.toDataURL('image/png')
}

/** 目的: DataURLをPNGファイルとしてダウンロードする。副作用: 一時a要素を生成してクリックイベントを発火する。前提: ブラウザ環境で実行する。 */
export function downloadPngDataUrl(dataUrl: string, fileName: string): void {
  const anchor: HTMLAnchorElement = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

/** 目的: カード画像の標準ファイル名でダウンロードを実行する。副作用: ブラウザダウンロードを実行する。前提: dataUrlはPNG形式である。 */
export function downloadCharaCardPng(dataUrl: string): void {
  downloadPngDataUrl(dataUrl, OUTPUT_FILE_NAME)
}
