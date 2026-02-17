export type TextMeasure = (text: string, fontSize: number) => number

export type FitAchievementTitleFontSizeArg = {
  title: string
  completedDateLabel: string
  baseFontSize: number
  minFontSize: number
  availableWidth: number
  gapWidth: number
  measure: TextMeasure
}

export type TruncateTextWithEllipsisArg = {
  text: string
  maxWidth: number
  fontSize: number
  measure: TextMeasure
}

/** 目的: タイトルと日付の合算幅が領域内に収まるフォントサイズを返す。副作用: なし。前提: baseFontSize >= minFontSize を満たす。 */
export function fitAchievementTitleFontSize(arg: FitAchievementTitleFontSizeArg): number {
  const safeBase = Math.max(arg.baseFontSize, arg.minFontSize)
  let currentFontSize = safeBase
  while (currentFontSize > arg.minFontSize) {
    const titleWidth = arg.measure(arg.title, currentFontSize)
    const dateWidth = arg.measure(arg.completedDateLabel, currentFontSize)
    if (titleWidth + dateWidth + arg.gapWidth <= arg.availableWidth) {
      return currentFontSize
    }
    currentFontSize -= 1
  }
  return arg.minFontSize
}

/** 目的: 単一行テキストを指定幅に収め、必要時は末尾を省略記号に置換する。副作用: なし。前提: maxWidth > 0 を想定する。 */
export function truncateTextWithEllipsis(arg: TruncateTextWithEllipsisArg): string {
  if (arg.maxWidth <= 0) {
    return ''
  }
  if (arg.measure(arg.text, arg.fontSize) <= arg.maxWidth) {
    return arg.text
  }

  const ellipsis = '...'
  const ellipsisWidth = arg.measure(ellipsis, arg.fontSize)
  if (ellipsisWidth > arg.maxWidth) {
    return ''
  }

  let output = ''
  for (const character of arg.text) {
    const candidate = `${output}${character}`
    const candidateWidth = arg.measure(candidate, arg.fontSize)
    if (candidateWidth + ellipsisWidth > arg.maxWidth) {
      break
    }
    output = candidate
  }

  return `${output}${ellipsis}`
}
