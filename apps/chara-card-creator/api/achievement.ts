import { isLocalError } from '@murofush/forfan-common-package/lib/function'
import { LocalError } from '@murofush/forfan-common-package/lib/types'
import {
  getElementsByClassName,
  getHTMLElementsByTagName,
  getTextByClassName,
  getTextByTagName,
  getLdstMainElement,
} from '@murofush/forfan-common-package/lib/scraping'
import { PRIVATE_ACHIEVEMENT } from '../common/const'
import { getDate } from './common'

// Repositoryの役割
export async function getAchievement(
  url: string
): Promise<CompletedAchievement[] | LocalError> {
  const completedAchievements: CompletedAchievement[] = []

  console.log(`fetch Achievements ${url}`)
  const ldstMainElement = await getLdstMainElement(url)
  if (isLocalError(ldstMainElement)) {
    return ldstMainElement
  }

  const achievementsClass = 'js--achievements'
  const achievementKindElements = getElementsByClassName(
    ldstMainElement,
    achievementsClass
  )
  if (isLocalError(achievementKindElements)) {
    const partsZeroClass = 'parts__zero'
    const partsZeroElements = getElementsByClassName(
      ldstMainElement,
      partsZeroClass
    )
    if (isLocalError(partsZeroElements)) {
      // parts_zeroも見つからない場合
      return partsZeroElements
    } else {
      return PRIVATE_ACHIEVEMENT
    }
  }

  const achievementsElements = getHTMLElementsByTagName(
    achievementKindElements[0],
    'li'
  )
  if (isLocalError(achievementsElements)) {
    return achievementsElements
  }

  for (const achievementElement of achievementsElements) {
    const entryAchievementClass = 'entry__achievement'
    const entryAchievementElements = getElementsByClassName(
      achievementElement,
      entryAchievementClass
    )
    if (isLocalError(entryAchievementElements)) {
      return entryAchievementElements
    }

    const achievementCompleteClass = 'entry__achievement--complete'
    if (
      entryAchievementElements[0].className.includes(achievementCompleteClass)
    ) {
      const achievementHistoryClass = 'entry__achievement--history'
      const achievementHistoryElements = getElementsByClassName(
        entryAchievementElements[0],
        achievementHistoryClass
      )
      if (isLocalError(achievementHistoryElements)) {
        return achievementHistoryElements
      }
      // タイトル
      const achievementTextClass = 'entry__activity__txt'
      const achievementText = getTextByClassName(
        achievementHistoryElements[0],
        achievementTextClass
      )

      // 日付
      const achievementDateClass = 'entry__activity__time'
      const achievementDateElements = getElementsByClassName(
        achievementHistoryElements[0],
        achievementDateClass
      )
      if (isLocalError(achievementDateElements)) {
        return achievementDateElements
      }
      const achievementDateScript = getTextByTagName(
        achievementDateElements[0],
        'script'
      )
      if (isLocalError(achievementDateScript)) {
        return achievementDateScript
      }

      const achievementDate = getDate(achievementDateScript)
      if (isLocalError(achievementDate)) {
        return achievementDate
      }
      if (isLocalError(achievementDate)) {
        return achievementDate
      }

      completedAchievements.push({
        title: achievementText,
        completedDate: new Date(achievementDate),
      } as CompletedAchievement)
    }
  }
  return completedAchievements
}
