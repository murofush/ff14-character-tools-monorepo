import { describe, expect, it } from 'vitest'
import {
  CARD_CANVAS_HEIGHT,
  CARD_CANVAS_WIDTH,
  buildCardLayout,
  calculateCropRect,
  getDefaultCardEditorSettings,
  resolveActiveCardColor,
  resolveCropRatio,
} from './cardEditorDomain'

describe('cardEditorDomain', () => {
  it('初期設定は自己紹介文を引き継ぐ', () => {
    const settings = getDefaultCardEditorSettings('こんにちは')
    expect(settings.description).toBe('こんにちは')
    expect(settings.theme).toBe('light')
    expect(settings.isFullSizeImage).toBe(false)
  })

  it('トリミング比率は画像レイアウト設定で切り替わる', () => {
    expect(resolveCropRatio(false)).toBeCloseTo(9 / 16)
    expect(resolveCropRatio(true)).toBeCloseTo(16 / 9)
  })

  it('横長画像では中央基準で幅を切り取る', () => {
    const rect = calculateCropRect(2000, 1000, 1, { x: 0, y: 0 })
    expect(rect.sourceWidth).toBeCloseTo(1000)
    expect(rect.sourceHeight).toBeCloseTo(1000)
    expect(rect.sourceX).toBeCloseTo(500)
    expect(rect.sourceY).toBe(0)
  })

  it('縦長画像ではfocus値に応じてY方向を切り取る', () => {
    const rectTop = calculateCropRect(1000, 2000, 1, { x: 0, y: -1 })
    const rectBottom = calculateCropRect(1000, 2000, 1, { x: 0, y: 1 })
    expect(rectTop.sourceY).toBeCloseTo(0)
    expect(rectBottom.sourceY).toBeCloseTo(1000)
  })

  it('旧Canvas互換としてプレビューサイズは常に16:9固定で扱える', () => {
    expect(CARD_CANVAS_WIDTH).toBe(1600)
    expect(CARD_CANVAS_HEIGHT).toBe(900)
    expect(CARD_CANVAS_HEIGHT / CARD_CANVAS_WIDTH).toBeCloseTo(9 / 16)
  })

  it('通常レイアウトは旧比率の画像幅を維持し、左右どちらにも配置できる', () => {
    const leftLayout = buildCardLayout(CARD_CANVAS_WIDTH, CARD_CANVAS_HEIGHT, false, false, 0)
    const rightLayout = buildCardLayout(CARD_CANVAS_WIDTH, CARD_CANVAS_HEIGHT, false, true, 0)

    expect(leftLayout.mainImageRect.width).toBe(506)
    expect(leftLayout.mainImageRect.x).toBe(0)
    expect(rightLayout.mainImageRect.x).toBe(CARD_CANVAS_WIDTH - 506)
    expect(leftLayout.infoPanelRect.width + leftLayout.mainImageRect.width).toBe(CARD_CANVAS_WIDTH)
  })

  it('全画面レイアウトではwidthSpaceが大きいほど情報パネルを狭くする（旧widthSpace係数）', () => {
    const widePanel = buildCardLayout(CARD_CANVAS_WIDTH, CARD_CANVAS_HEIGHT, true, false, 0)
    const narrowPanel = buildCardLayout(CARD_CANVAS_WIDTH, CARD_CANVAS_HEIGHT, true, false, 100)

    expect(widePanel.infoPanelRect.width).toBeGreaterThan(narrowPanel.infoPanelRect.width)
    expect(widePanel.infoPanelRect.x).toBe(506)
    expect(narrowPanel.infoPanelRect.x).toBe(906)
    expect(widePanel.mainImageRect.width).toBe(CARD_CANVAS_WIDTH)
  })

  it('配色上書きON時はカスタム配色を優先する', () => {
    const base = getDefaultCardEditorSettings('')
    const next = {
      ...base,
      isCardColorChangeable: true,
      cardColor: {
        textColor: '#101010',
        backgroundColor: '#fafafa',
        accentColor: '#123456',
      },
    }
    expect(resolveActiveCardColor(base).backgroundColor).toBe('#FFFFFF')
    expect(resolveActiveCardColor(next).accentColor).toBe('#123456')
  })
})
