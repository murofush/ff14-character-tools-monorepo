import { describe, expect, it } from 'vitest'
import {
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

  it('通常レイアウトは左右どちらにも画像を配置できる', () => {
    const leftLayout = buildCardLayout(900, 1600, false, false, 0)
    const rightLayout = buildCardLayout(900, 1600, false, true, 0)
    expect(leftLayout.mainImageRect.x).toBe(0)
    expect(rightLayout.mainImageRect.x).toBeGreaterThan(0)
    expect(leftLayout.infoPanelRect.width + leftLayout.mainImageRect.width).toBe(900)
  })

  it('全画面レイアウトではwidthSpaceが大きいほど情報パネルを狭くする', () => {
    const widePanel = buildCardLayout(1600, 900, true, false, 0)
    const narrowPanel = buildCardLayout(1600, 900, true, false, 100)
    expect(widePanel.infoPanelRect.width).toBeGreaterThan(narrowPanel.infoPanelRect.width)
    expect(widePanel.mainImageRect.width).toBe(1600)
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
