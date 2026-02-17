import { describe, expect, it } from 'vitest'
import {
  fitAchievementTitleFontSize,
  truncateTextWithEllipsis,
} from './cardTypographyDomain'

/** 目的: 1文字あたりの幅を簡易的に返すテスト用measure関数を生成する。副作用: なし。前提: fontSizeに比例して幅が増えるモデルで検証する。 */
function createMeasure(charWidthRate: number): (text: string, fontSize: number) => number {
  return (text: string, fontSize: number): number => text.length * fontSize * charWidthRate
}

describe('cardTypographyDomain', () => {
  it('タイトルと日付の合算幅が領域を超える場合、タイトルfontを縮小する', () => {
    const measure = createMeasure(0.6)
    const fontSize = fitAchievementTitleFontSize({
      title: '非常に長いアチーブメントタイトルです',
      completedDateLabel: '2026-02-17',
      baseFontSize: 24,
      minFontSize: 14,
      availableWidth: 360,
      gapWidth: 12,
      measure,
    })

    expect(fontSize).toBeLessThan(24)
    expect(fontSize).toBeGreaterThanOrEqual(14)
  })

  it('領域に収まる場合はベースfontを維持する', () => {
    const measure = createMeasure(0.45)
    const fontSize = fitAchievementTitleFontSize({
      title: '短いタイトル',
      completedDateLabel: '2026-02-17',
      baseFontSize: 24,
      minFontSize: 14,
      availableWidth: 480,
      gapWidth: 12,
      measure,
    })

    expect(fontSize).toBe(24)
  })

  it('説明文を指定幅に収めて末尾省略できる', () => {
    const measure = createMeasure(0.55)
    const output = truncateTextWithEllipsis({
      text: 'これは非常に長い説明文であり、カードの表示幅を超えることを想定しています。',
      maxWidth: 180,
      fontSize: 18,
      measure,
    })

    expect(output.endsWith('...')).toBe(true)
    expect(output.length).toBeLessThan(30)
  })
})
