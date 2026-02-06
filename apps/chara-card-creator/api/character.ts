import { isLocalError } from '@murofush/forfan-common-package/lib/function'
import { LocalError } from '@murofush/forfan-common-package/lib/types'
import {
  getElementsByClassName,
  getElementsByTagName,
  getHTMLElementsByTagName,
  getLdstMainElement,
  getTextByClassName,
  getTextByElement,
  getTextByTagName,
} from '@murofush/forfan-common-package/lib/scraping'

// Repositoryの役割
export async function getCharacterInfo(
  url: string
): Promise<CharacterInfo | LocalError> {
  const nbsp = String.fromCharCode(160)

  console.log(`fetch CharacterInfo ${url}`)
  const ldstMainElement = await getLdstMainElement(url)
  if (isLocalError(ldstMainElement)) {
    return ldstMainElement
  }

  // キャラクター名
  const frameCharaNameClass = 'frame__chara__name'
  const name = getTextByClassName(ldstMainElement, frameCharaNameClass)
  if (isLocalError(name)) {
    return name
  }
  const firstName = name.split(' ')[0]
  const lastName = name.split(' ')[1]

  // サーバー、DC
  const charaWorldClass = 'frame__chara__world'
  const serverDc = getTextByClassName(ldstMainElement, charaWorldClass)
  if (isLocalError(serverDc)) {
    return serverDc
  }
  const server = serverDc.split(nbsp)[0]
  // eslint-disable-next-line no-useless-escape
  const datacenter = serverDc.split(nbsp)[1].replace(/\(([^\)]*)\)/g, '$1')

  // キャラクタープロフィール
  const characterBlockClass = 'character-block'
  // キャラクター見た目情報
  const characterBlockElements = getElementsByClassName(
    ldstMainElement,
    characterBlockClass
  )
  if (isLocalError(characterBlockElements)) {
    return characterBlockElements
  }

  const characterBlockNameClass = 'character-block__name'
  const charaInfomationElements = getElementsByClassName(
    characterBlockElements[0],
    characterBlockNameClass
  )
  if (isLocalError(charaInfomationElements)) {
    return charaInfomationElements
  }
  const characterInfomationHtml = charaInfomationElements[0].innerHTML
  const race = characterInfomationHtml.split('<br>')[0]
  if (race == null) {
    return {
      key: 'not_found_text',
      value: `Class: ${characterBlockNameClass} 種族の取得に失敗しました。`,
    }
  }
  const clan = characterInfomationHtml.split('<br>')[1].split(' / ')[0]
  if (clan == null) {
    return {
      key: 'not_found_text',
      value: `Class: ${characterBlockNameClass} 部族の取得に失敗しました。`,
    }
  }
  const gender = characterInfomationHtml.split('<br>')[1].split(' / ')[1]
  if (gender == null || !(gender === '♂' || gender === '♀')) {
    return {
      key: 'not_found_text',
      value: `Class: ${characterBlockNameClass} 性別の取得に失敗しました。`,
    }
  }

  // キャラクター誕生日情報
  const characterBirthClass = 'character-block__birth'
  const birthText = getTextByClassName(ldstMainElement, characterBirthClass)
  if (isLocalError(birthText)) {
    return birthText
  }
  // TODO: 言語別にregexpを設定する。
  const birthRegexp =
    /星\d+月\((1[0-2]|[1-9])月\) (1[0-9]|2[0-9]|3[01]|[1-9])日/
  const birthDate = birthText.match(birthRegexp)
  if (!birthDate) {
    return {
      key: 'not_found_element',
      value: `Class: ${characterBirthClass} Birth Dateの取得に失敗しました。`,
    }
  }
  const birthMonth = birthDate[1]
  const birthDay = birthDate[2]

  // フリーカンパニー

  // Nullable 変数定義
  let fcUrlPath: string | null = null

  const freeCompanyNameClass = 'character__freecompany__name'
  const freeCompanyNameElements = getElementsByClassName(
    ldstMainElement,
    freeCompanyNameClass
  )
  // FCに所属していない場合、取得できないのでその場合は無視する。
  if (!isLocalError(freeCompanyNameElements)) {
    const getFreeCompanyElements = getHTMLElementsByTagName(
      freeCompanyNameElements[0],
      'a'
    )
    if (isLocalError(getFreeCompanyElements)) {
      return getFreeCompanyElements
    }
    const freeCompanyName = getTextByElement(getFreeCompanyElements[0])
    if (isLocalError(freeCompanyName)) {
      return freeCompanyName
    }
    fcUrlPath = getFreeCompanyElements[0].href

    // フリーカンパニー画像
    const freeCompanyCrestClass = 'character__freecompany__crest'
    const freeCompanyCrestElements = getElementsByClassName(
      ldstMainElement,
      freeCompanyCrestClass
    )
    if (isLocalError(freeCompanyCrestElements)) {
      return freeCompanyCrestElements
    }

    const freeCompanyCrestImageUrl: string[] = []
    const freeCompanyCrestImageElements = getHTMLElementsByTagName(
      freeCompanyCrestElements[0],
      'img'
    )
    if (isLocalError(freeCompanyCrestImageElements)) {
      return freeCompanyCrestImageElements
    }
    for (const fcImageElement of freeCompanyCrestImageElements) {
      freeCompanyCrestImageUrl.push(fcImageElement.src)
    }
  }

  // PvP

  // Nullable 変数定義
  let pvpTeamInfo: PvpTeamInfo | null = null

  const pvpTeamNameClass = 'character__pvpteam__name'
  const pvpTeamNameElements = getElementsByClassName(
    ldstMainElement,
    pvpTeamNameClass
  )
  // PvPチームに所属していない場合、取得できないのでその場合は無視する。
  if (!isLocalError(pvpTeamNameElements)) {
    const pvpTeamName = getTextByTagName(pvpTeamNameElements[0], 'a')
    if (isLocalError(pvpTeamName)) {
      return pvpTeamName
    }

    // PvPチームアイコン画像
    const pvpTeamCrestClass = 'character__pvpteam__crest__image'
    const pvpTeamCrestElements = getElementsByClassName(
      ldstMainElement,
      pvpTeamCrestClass
    )
    if (isLocalError(pvpTeamCrestElements)) {
      return pvpTeamCrestElements
    }

    const pvpTeamCrestImageElements = getHTMLElementsByTagName(
      pvpTeamCrestElements[0],
      'img'
    )
    if (isLocalError(pvpTeamCrestImageElements)) {
      return pvpTeamCrestImageElements
    }
    const pvpTeamCrestImageUrls: string[] = []
    for (const pvpImageElement of pvpTeamCrestImageElements) {
      pvpTeamCrestImageUrls.push(pvpImageElement.src)
    }
    pvpTeamInfo = {
      name: pvpTeamName,
      crestImageUrls: pvpTeamCrestImageUrls,
    }
  }

  // 自己紹介文
  const selfintroductionClass = 'character__selfintroduction'
  let selfintroduction: string | LocalError | null = getTextByClassName(
    ldstMainElement,
    selfintroductionClass
  )
  if (isLocalError(selfintroduction)) {
    return selfintroduction
  }
  if (
    selfintroduction === null ||
    selfintroduction === '' ||
    selfintroduction === '未設定' ||
    selfintroduction === '-'
  ) {
    selfintroduction = null
  }

  // 更新日取得
  // 取得できない。要確認。
  // const headingIconUpdateClass = 'heading__icon__update'
  // const headingIconUpdateElements = getElementsByClassName(
  //   ldstMainElement,
  //   headingIconUpdateClass
  // )
  // if (isLocalError(headingIconUpdateElements)) {
  //   return headingIconUpdateElements
  // }
  // const updatedDateScript = getTextByTagName(
  //   headingIconUpdateElements[0],
  //   'script'
  // )
  // if (isLocalError(updatedDateScript)) {
  //   return updatedDateScript
  // }
  // const updatedDate = getDate(updatedDateScript)
  // if (isLocalError(updatedDate)) {
  //   return updatedDate
  // }
  // キャラクターレベル
  const characterLevelClass = 'character__level__list'
  const charLevelElements = getElementsByClassName(
    ldstMainElement,
    characterLevelClass
  )
  if (isLocalError(charLevelElements)) {
    return charLevelElements
  }
  // Tank / Healer
  const tankHealerLi = getElementsByTagName(charLevelElements[0], 'li')
  if (isLocalError(tankHealerLi)) {
    return tankHealerLi
  }

  // DPS
  const dpsLi = getElementsByTagName(charLevelElements[1], 'li')
  if (isLocalError(dpsLi)) {
    return dpsLi
  }

  // Crafter
  const crafterLi = getElementsByTagName(charLevelElements[2], 'li')
  if (isLocalError(crafterLi)) {
    return crafterLi
  }

  // Gatherer
  const gathererLi = getElementsByTagName(charLevelElements[3], 'li')
  if (isLocalError(gathererLi)) {
    return gathererLi
  }

  const charaData: CharacterInfo = {
    firstName,
    lastName,
    selfintroduction,
    server,
    datacenter,
    race,
    clan,
    gender,
    birthMonth,
    birthDay,
    // updatedDate,
    battleRoles: {
      tankRole: {
        paladin: toLevel(tankHealerLi[0]),
        warrior: toLevel(tankHealerLi[1]),
        darkKnight: toLevel(tankHealerLi[2]),
        gunbreaker: toLevel(tankHealerLi[3]),
      },
      healerRole: {
        whiteMage: toLevel(tankHealerLi[4]),
        scholar: toLevel(tankHealerLi[5]),
        astrologian: toLevel(tankHealerLi[6]),
      },
      dpsRole: {
        meleeDps: {
          monk: toLevel(dpsLi[0]),
          dragoon: toLevel(dpsLi[1]),
          ninja: toLevel(dpsLi[2]),
          samurai: toLevel(dpsLi[3]),
        },
        physicalRangedDps: {
          bard: toLevel(dpsLi[4]),
          machinist: toLevel(dpsLi[5]),
          dancer: toLevel(dpsLi[6]),
        },
        magicalRangedDps: {
          blackMage: toLevel(dpsLi[7]),
          summoner: toLevel(dpsLi[8]),
          redMage: toLevel(dpsLi[9]),
        },
        limitedDps: {
          blueMage: toLevel(dpsLi[10]),
        },
      },
    },
    crafter: {
      carpenter: toLevel(crafterLi[0]),
      blacksmith: toLevel(crafterLi[1]),
      armorer: toLevel(crafterLi[2]),
      goldsmith: toLevel(crafterLi[3]),
      leatherworker: toLevel(crafterLi[4]),
      weaver: toLevel(crafterLi[5]),
      alchemist: toLevel(crafterLi[6]),
      culinarian: toLevel(crafterLi[7]),
    },
    gatherer: {
      miner: toLevel(gathererLi[0]),
      botanist: toLevel(gathererLi[1]),
      fisher: toLevel(gathererLi[2]),
    },
  }
  // Optional
  if (fcUrlPath) {
    charaData.fcUrlPath = fcUrlPath
  }
  if (pvpTeamInfo) {
    charaData.pvpTeamInfo = pvpTeamInfo
  }
  return charaData
}

function toLevel(html: Element): Level {
  let level = parseInt(html.textContent || '-')
  level = isNaN(level) ? 0 : level
  return {
    level,
  }
}
