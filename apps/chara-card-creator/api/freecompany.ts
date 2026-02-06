import { isLocalError } from '@murofush/forfan-common-package/lib/function'
import { LocalError } from '@murofush/forfan-common-package/lib/types'
import {
  getElementsByClassName,
  getHTMLElementsByTagName,
  getTextByClassName,
  getLdstMainElement,
  getTextByTagName,
  getTextByElement,
} from '@murofush/forfan-common-package/lib/scraping'
import { getBaseImageUrl } from './common'

// Repositoryの役割
export async function getFreeCompanyInfomation(
  url: string
): Promise<FreecompanyInfo | LocalError> {
  console.log(`fetch ${url}`)
  const ldstMainElement = await getLdstMainElement(url)
  if (isLocalError(ldstMainElement)) {
    return ldstMainElement
  }
  const crestImagesClass = 'entry__freecompany__crest__image'
  const crestDivImagesElements = getElementsByClassName(
    ldstMainElement,
    crestImagesClass
  )
  if (isLocalError(crestDivImagesElements)) {
    return crestDivImagesElements
  }
  const crestImageElements = getHTMLElementsByTagName(
    crestDivImagesElements[0],
    'img'
  )
  if (isLocalError(crestImageElements)) {
    return crestImageElements
  }
  const fcCrestImageUrls: string[] = []

  for (const crestImageElement of crestImageElements) {
    fcCrestImageUrls.push(crestImageElement.src)
  }

  const fcCrestBaseImageUrls = await Promise.all(
    fcCrestImageUrls.map(async (imageUrl) => {
      return await getBaseImageUrl(imageUrl)
    })
  )
  for (const crestBaseImageUrl of fcCrestBaseImageUrls) {
    if (isLocalError(crestBaseImageUrl)) {
      return crestBaseImageUrl
    }
  }

  const fcTextNameClass = 'freecompany__text__name'
  const fcName = getTextByClassName(ldstMainElement, fcTextNameClass)
  if (isLocalError(fcName)) {
    return fcName
  }
  const fcTextTagClass = 'freecompany__text freecompany__text__tag'
  const fcTag = getTextByClassName(ldstMainElement, fcTextTagClass)
  if (isLocalError(fcTag)) {
    return fcTag
  }
  // 汎用FC情報で、順番のみで参照してるのでここがずれることがあるかも？
  const freeCompanyTextClass = 'freecompany__text'
  const freeComapnyTextElements = getElementsByClassName(
    ldstMainElement,
    freeCompanyTextClass
  )
  if (isLocalError(freeComapnyTextElements)) {
    return freeComapnyTextElements
  }
  const memberCountStr = getTextByElement(freeComapnyTextElements[3])
  if (isLocalError(memberCountStr)) {
    return memberCountStr
  }
  const memberCountRegexp = /(\d+)名/
  const matchedMemberCount = memberCountStr.match(memberCountRegexp)
  if (!matchedMemberCount || !matchedMemberCount[1]) {
    return {
      key: 'not_found_text',
      value: `${freeCompanyTextClass}[3] > ${memberCountStr}からメンバーの抽出に失敗しました。`,
    }
  }
  const fcMemberCount = parseInt(matchedMemberCount[1])
  if (isNaN(fcMemberCount)) {
    return {
      key: 'not_found_text',
      value: `${freeCompanyTextClass}[3] > ${fcMemberCount}からメンバー数の取得に失敗しました。`,
    }
  }

  const fcEstateTextClass = 'freecompany__estate__text'
  const fcEstateText = getTextByClassName(ldstMainElement, fcEstateTextClass)
  let fcHouseState: string | null = null
  // FCハウスがない場合は取得できないためないことは許容する。
  if (!isLocalError(fcEstateText)) {
    fcHouseState = fcEstateText
  }

  const freecompanyInfo: FreecompanyInfo = {
    fcName,
    fcTag,
    // error チェックしてる
    fcCrestBaseImageUrls: fcCrestBaseImageUrls as string[],
    fcMemberCount,
  }
  if (fcHouseState) {
    freecompanyInfo.fcHouseState = fcHouseState
  }
  return freecompanyInfo
}
export async function getFreeCompanyPositionByName(
  url: string,
  characterName: string
): Promise<FreecompanyPositionInfo | LocalError | null> {
  console.log(`fetch ${url}`)
  const ldstMainElement = await getLdstMainElement(url)
  if (isLocalError(ldstMainElement)) {
    return ldstMainElement
  }
  const result = getFcPositionByNameProcess(ldstMainElement, characterName)
  if (isLocalError(result)) {
    return result
  }
  if (result) {
    return result
  } else {
    /*
     * 注意書き
     *
     * FCのメンバーページの Xページ/Xページ からぺーじ数を取得する方法
     * 現在はFCのメンバー数を元にページ数を参照し、index.ts側から全体取得を行うようにしているのでここは使ってない。
     * そちらに不都合があった場合にはこちらを利用すること
     */
    // // １ページ目で見つからなかった場合
    // const nextPages = getAllNextPageNumber(ldstMainElement)
    // if (isLocalError(nextPages)) {
    //   return nextPages
    // }
    // if (nextPages.length <= 0) {
    //   return {
    //     key: 'not_found_user',
    //     value: 'FreeCompanyからユーザ情報の取得に失敗しました。',
    //   }
    // }
    // const nextResults = await Promise.all(
    //   nextPages.map(async (nextPage) => {
    //     const nextUrl = getPageNumber(url, nextPage)
    //     const ldstMainElement = await getLdstMainElement(nextUrl)
    //     if (isLocalError(ldstMainElement)) {
    //       return ldstMainElement
    //     }
    //     return getFcPositionByNameProcess(ldstMainElement, characterName)
    //   })
    // )
    // for (const nextResult of nextResults) {
    //   if (isLocalError(nextResult) || nextResult) {
    //     return nextResult
    //   }
    // }
    return null
  }
}

async function getFcPositionByNameProcess(
  ldstMainElement: Element,
  characterName: string
): Promise<FreecompanyPositionInfo | LocalError | null> {
  const entryFlexClass = 'entry__freecompany__center'
  const entryFlexElements = getElementsByClassName(
    ldstMainElement,
    entryFlexClass
  )
  if (isLocalError(entryFlexElements)) {
    return entryFlexElements
  }
  for (const fcCharacterListElement of entryFlexElements) {
    const entryNameClass = 'entry__name'
    const fcCharacterName = getTextByClassName(
      fcCharacterListElement,
      entryNameClass
    )
    if (isLocalError(fcCharacterName)) {
      return fcCharacterName
    }
    if (fcCharacterName === characterName) {
      const entryFreeCompanyInfoClass = 'entry__freecompany__info'
      const entryFreeCompanyInfoElements = getElementsByClassName(
        fcCharacterListElement,
        entryFreeCompanyInfoClass
      )
      if (isLocalError(entryFreeCompanyInfoElements)) {
        return entryFreeCompanyInfoElements
      }
      const fcInfoImg = getHTMLElementsByTagName(
        entryFreeCompanyInfoElements[0],
        'img'
      )
      if (isLocalError(fcInfoImg)) {
        return fcInfoImg
      }
      const fcName = getTextByTagName(entryFreeCompanyInfoElements[0], 'span')
      if (isLocalError(fcName)) {
        return fcName
      }
      const blobUrl = await getBaseImageUrl(fcInfoImg[0].src)
      if (isLocalError(blobUrl)) {
        return blobUrl
      }
      return {
        positionBaseImageUrl: blobUrl,
        positionName: fcName,
      } as FreecompanyPositionInfo
    }
  }
  return null
}

/**
 * 次のページのページ番号を返す。ない場合には-1
 * 現在は使ってない。理由は上記の「注意書き」を参照
 * @param document
 */
// function getAllNextPageNumber(ldstMainElement: Element): number[] | error {
//   const pagerClass = 'btn__pager__current'
//   const pager = getTextByClassName(ldstMainElement, pagerClass)
//   if (isLocalError(pager)) {
//     return pager
//   }
//   const pargerRegexp = /(\d+)ページ \/ (\d+)ページ/
//   const pagerMatched = pager.match(pargerRegexp)
//   if (!pagerMatched) {
//     return {
//       key: 'does_not_matched',
//       value: `Class: ${pager} からpagerMatchedの取得に失敗しました。`,
//     }
//   }
//   // 現状、一番最初のページでのみ実行する予定なので、「1」のみ参照される予定
//   const currentPage = parseInt(pagerMatched[1])
//   if (isNaN(currentPage)) {
//     return {
//       key: 'does_not_matched',
//       value: `Class: ${pager} からcurrentPageの取得に失敗しました。`,
//     }
//   }
//   const totalPage = parseInt(pagerMatched[2])
//   if (isNaN(totalPage)) {
//     return {
//       key: 'does_not_matched',
//       value: `Class: ${pager} からtotalPageの取得に失敗しました。`,
//     }
//   }
//   if (totalPage > currentPage) {
//     return new Array(totalPage - currentPage)
//       .fill(currentPage)
//       .map((x, y) => x + y + 1)
//   }
//   // 現在のページが全ページ数と同じ場合
//   return []
// }
