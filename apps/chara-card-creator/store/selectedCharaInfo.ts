import { LocalError } from '@murofush/forfan-common-package/lib/types'
import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators'
import { fontJP, maxAchievementCount, themeColor } from '~/common/const'
import {
  AchievementStore,
  SelectedCharaInfoStore,
} from '~/utils/store-accessor'
import rfdc from 'rfdc'
import tinycolor from 'tinycolor2'
const clone = rfdc()

@Module({
  name: 'selectedCharaInfo',
  stateFactory: true,
  namespaced: true,
})
export default class SelectedCharaInfoIndexModule extends VuexModule {
  private achievementIndexes: AchievementIndexPath[] = []
  private mainJob: JobWithLevel | null = null
  private description: string = ''
  private theme: Theme = 'light'
  private cardColor: CardColor = clone(themeColor.light)
  private charaNameFontFamily: string = fontJP[0].name
  private charaInfoFontFamilyJP: string = fontJP[0].name
  private charaInfoFontFamilyEN: string | null = null
  private charaInfoFontFamilyENEnabled: boolean = false
  private isCardColorChangeable: boolean = false
  private disabledBeforeUnlockAccent: boolean = false
  private nameTextBold: boolean = false
  private infoTextBold: boolean = false
  private isFullSizeImage: boolean = false
  private isImageRight: boolean = false
  private infoBackgroundOpacity: number = 1
  private widthSpace: number = 0
  // Image Params
  private sideMainImage: HTMLImageElement | undefined = undefined
  private fullMainImage: HTMLImageElement | undefined = undefined

  get getAchievements(): AchievementDataWithIndex[] {
    const CompletedAchievement: AchievementDataWithIndex[] = []
    for (const [
      index,
      selectedAchievementIndex,
    ] of this.achievementIndexes.entries()) {
      const achievementKinds =
        AchievementStore.getAchievementKinds[selectedAchievementIndex.kindIndex]
      if (!achievementKinds) {
        SelectedCharaInfoStore.deleteSelectedAchievementIndexByIndex(index)
        continue
      }
      CompletedAchievement.push({
        data: achievementKinds.achievementCategories[
          selectedAchievementIndex.categoryIndex
        ].group[selectedAchievementIndex.groupIndex].data[
          selectedAchievementIndex.achievementIndex
        ],
        indexes: selectedAchievementIndex,
      })
    }
    return CompletedAchievement
  }

  get getAchievementIndexes(): AchievementIndexPath[] {
    return this.achievementIndexes
  }

  get getMainJob(): JobWithLevel | null {
    return this.mainJob
  }

  get getDescription(): string {
    return this.description
  }

  get getTheme(): Theme {
    return this.theme
  }

  get getCardColor(): CardColor {
    return this.isCardColorChangeable ? this.cardColor : themeColor[this.theme]
  }

  get getCharaNameFontFamily(): string {
    return this.charaNameFontFamily
  }

  get getCharaInfoFontFamily(): string {
    return this.charaInfoFontFamilyEN && this.charaInfoFontFamilyENEnabled
      ? `${this.charaInfoFontFamilyEN}, ${this.charaInfoFontFamilyJP}`
      : this.charaInfoFontFamilyJP
  }

  get getCharaInfoFontFamilyJP(): string {
    return this.charaInfoFontFamilyJP
  }

  get getCharaInfoFontFamilyEN(): string | null {
    return this.charaInfoFontFamilyEN
  }

  get getCharaInfoFontFamilyENEnabled(): boolean {
    return this.charaInfoFontFamilyENEnabled
  }

  get getIsCardColorChangeable(): boolean {
    return this.isCardColorChangeable
  }

  get getDisabledBeforeUnlockAccent(): boolean {
    return this.disabledBeforeUnlockAccent
  }

  get getNameTextBold(): boolean {
    return this.nameTextBold
  }

  get getInfoTextBold(): boolean {
    return this.infoTextBold
  }
  get getIsFullSizeImage(): boolean {
    return this.isFullSizeImage
  }
  get getInfoBackgroundOpacity(): number {
    return this.infoBackgroundOpacity
  }

  get getSideMainImage(): HTMLImageElement | undefined {
    return this.sideMainImage
  }

  get getFullMainImage(): HTMLImageElement | undefined {
    return this.fullMainImage
  }

  get getWidthSpace(): number {
    return this.widthSpace
  }

  get getIsImageRight(): boolean {
    return this.isImageRight
  }

  @Mutation
  setSelectedAchievementIndexMutation(achievementIndex: AchievementIndexPath) {
    this.achievementIndexes.push(achievementIndex)
  }

  @Mutation
  deleteSelectedAchievementIndexMutation(index: number) {
    this.achievementIndexes.splice(index, 1)
  }

  @Mutation
  resetSelectedAchievementIndexMutation() {
    this.achievementIndexes = []
    this.mainJob = null
  }

  @Mutation
  setDescriptionMutation(val: string) {
    this.description = val
  }

  @Mutation
  setThemeMutation(val: Theme) {
    this.theme = val
  }

  @Mutation
  setCardColorMutation(val: CardColor) {
    this.cardColor = val
  }

  @Mutation
  setTextColorMutation(val: string) {
    this.cardColor.textColor = val
  }

  @Mutation
  setBackgroundColorMutation(val: string) {
    this.cardColor.backgroundColor = val
  }

  @Mutation
  setAccentColorMutation(val: string) {
    this.cardColor.accentColor = val
  }

  @Mutation
  setCharaNameFontFamilyMutation(val: string) {
    this.charaNameFontFamily = val
  }

  @Mutation
  setCharaInfoFontFamilyJPMutation(val: string) {
    this.charaInfoFontFamilyJP = val
  }

  @Mutation
  setCharaInfoFontFamilyENMutation(val: string | null) {
    this.charaInfoFontFamilyEN = val
  }

  @Mutation
  setCharaInfoFontFamilyENEnabledMutation(val: boolean) {
    this.charaInfoFontFamilyENEnabled = val
  }

  @Mutation
  setIsCardColorChangeableMutation(val: boolean) {
    this.isCardColorChangeable = val
  }

  @Mutation
  setDisabledBeforeUnlockAccentMutation(val: boolean) {
    this.disabledBeforeUnlockAccent = val
  }

  @Mutation
  setNameTextBoldMutation(val: boolean) {
    this.nameTextBold = val
  }

  @Mutation
  setInfoTextBoldMutation(val: boolean) {
    this.infoTextBold = val
  }

  @Mutation
  setIsFullSizeImageMutation(val: boolean) {
    this.isFullSizeImage = val
  }

  @Mutation
  setInfoBackgroundOpacityMutation(val: number) {
    this.infoBackgroundOpacity = val
  }

  @Mutation
  setSideMainImageMutation(val: HTMLImageElement | undefined) {
    this.sideMainImage = val
  }

  @Mutation
  setFullMainImageMutation(val: HTMLImageElement | undefined) {
    this.fullMainImage = val
  }

  @Mutation
  setWidthSpaceMutation(val: number) {
    this.widthSpace = val
  }

  @Mutation
  setIsImageRightMutation(val: boolean) {
    this.isImageRight = val
  }

  @Action({ rawError: true })
  setSelectedAchievementIndex(achievementIndex: AchievementIndexPath) {
    if (this.achievementIndexes.length >= maxAchievementCount) {
      return {
        key: 'max_selected_achievement',
        value: '既にアチーブメントが最大数選択されています。',
        fatal: true,
      } as LocalError
    }
    if (
      duplicateAchievementIndex(this.achievementIndexes, achievementIndex) !==
      -1
    ) {
      return {
        key: 'duplicated_achievement',
        value: 'INTERNAL_ERROR: 選択されたアチーブメントが重複しています。',
      } as LocalError
    }
    this.setSelectedAchievementIndexMutation(achievementIndex)
  }

  @Action({ rawError: true })
  deleteSelectedAchievementIndexByIndex(index: number) {
    if (this.achievementIndexes[index]) {
      this.deleteSelectedAchievementIndexMutation(index)
    }
  }

  @Action({ rawError: true })
  deleteSelectedAchievementIndexByValues(
    selectedAchievementIndex: AchievementIndexPath
  ) {
    const duplicatedIndex = duplicateAchievementIndex(
      this.achievementIndexes,
      selectedAchievementIndex
    )
    if (duplicatedIndex === -1) {
      return {
        key: 'duplicated_achievement',
        value:
          'INTERNAL_ERROR: 選択解除したいアチーブメントが選択されていません。',
      } as LocalError
    }
    this.deleteSelectedAchievementIndexMutation(duplicatedIndex)
  }

  @Action({ rawError: true })
  resetSelectedAchievementIndex() {
    this.resetSelectedAchievementIndexMutation()
  }

  @Action({ rawError: true })
  setDescription(val: string) {
    this.setDescriptionMutation(val)
  }

  @Action({ rawError: true })
  setTheme(val: Theme) {
    const base: CardColor = themeColor[this.theme]
    const updateDate: CardColor = clone(themeColor[val])
    for (const key of Object.keys(base) as (keyof CardColor)[]) {
      if (!tinycolor.equals(base[key], this.cardColor[key])) {
        updateDate[key] = this.cardColor[key]
      }
    }
    this.setThemeMutation(val)
    this.setCardColorMutation(updateDate)
  }

  @Action({ rawError: true })
  setTextColor(val: string) {
    this.setTextColorMutation(val)
  }

  @Action({ rawError: true })
  setBackgroundColor(val: string) {
    this.setBackgroundColorMutation(val)
  }

  @Action
  setAccentColor(val: string) {
    this.setAccentColorMutation(val)
  }

  @Action({ rawError: true })
  resetCardColor() {
    this.setCardColorMutation(clone(themeColor[this.theme]))
  }

  @Action({ rawError: true })
  setCardColor(val: CardColor) {
    this.setCardColorMutation(val)
  }

  @Action
  setCharaNameFontFamily(val: string) {
    this.setCharaNameFontFamilyMutation(val)
  }

  @Action({ rawError: true })
  setCharaInfoFontFamilyJP(val: string) {
    this.setCharaInfoFontFamilyJPMutation(val)
  }

  @Action({ rawError: true })
  setCharaInfoFontFamilyEN(val: string | null) {
    this.setCharaInfoFontFamilyENMutation(val)
  }

  @Action({ rawError: true })
  setCharaInfoFontFamilyENEnabled(val: boolean) {
    this.setCharaInfoFontFamilyENEnabledMutation(val)
  }

  @Action({ rawError: true })
  setIsCardColorChangeable(val: boolean) {
    this.setIsCardColorChangeableMutation(val)
  }

  @Action({ rawError: true })
  setDisabledBeforeUnlockAccent(val: boolean) {
    this.setDisabledBeforeUnlockAccentMutation(val)
  }

  @Action({ rawError: true })
  setNameTextBold(val: boolean) {
    this.setNameTextBoldMutation(val)
  }

  @Action({ rawError: true })
  setInfoTextBold(val: boolean) {
    this.setInfoTextBoldMutation(val)
  }

  @Action({ rawError: true })
  setIsFullSizeImage(val: boolean) {
    this.setIsFullSizeImageMutation(val)
  }

  @Action({ rawError: true })
  setInfoBackgroundOpacity(val: number) {
    this.setInfoBackgroundOpacityMutation(val)
  }

  @Action({ rawError: true })
  setMainImage(val: HTMLImageElement | undefined) {
    if (this.isFullSizeImage) {
      this.setFullMainImageMutation(val)
    } else {
      this.setSideMainImageMutation(val)
    }
  }

  @Action({ rawError: true })
  setWidthSpace(val: number) {
    this.setWidthSpaceMutation(val)
  }

  @Action
  setIsImageRight(val: boolean) {
    this.setIsImageRightMutation(val)
  }
}

function duplicateAchievementIndex(
  existAchievementIndexes: AchievementIndexPath[],
  selectedAchievementIndex: AchievementIndexPath
) {
  for (const [
    index,
    existAchievementIndex,
  ] of existAchievementIndexes.entries()) {
    let duplicated = true
    for (const key of Object.keys(existAchievementIndex)) {
      if (
        existAchievementIndex[key as keyof AchievementIndexPath] !==
        selectedAchievementIndex[key as keyof AchievementIndexPath]
      ) {
        duplicated = false
        break
      }
    }
    if (duplicated) return index
  }
  return -1
}
