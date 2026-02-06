import express from 'express'
import { LocalError } from '@murofush/forfan-common-package/lib/types'
import { isLocalError } from '@murofush/forfan-common-package/lib/function'
import { KIND, LOADSTONE_URL } from '@murofush/forfan-common-package/lib/const'
import {
  LOADSTONE_CHARA_PAGE_REGPEX,
  PRIVATE_ACHIEVEMENT,
} from '../common/const'

import { SCRAPING_ERROR } from '@murofush/forfan-common-package/lib/const'
import * as character from './character'
import * as achievement from './achievement'
import * as freecompany from './freecompany'

const app = express()
// Usecaseの役割
app.get('/get_character_info', async (req, res) => {
  try {
    if (!req.query.url) {
      res.status(400)
      res.send({
        key: 'url_invalid',
        value: 'URLを設定してください。',
      })
      return
    }
    const matchedCharacterURL = (req.query.url as string)
      .split(/\?|#/)[0]
      .match(LOADSTONE_CHARA_PAGE_REGPEX)
    if (
      typeof req.query.url !== 'string' ||
      !(
        matchedCharacterURL &&
        matchedCharacterURL.length >= 0 &&
        !isNaN(parseInt(matchedCharacterURL[1]))
      )
    ) {
      res.status(400)
      res.send({
        key: 'url_invalid',
        value: 'URLはloadstoneのキャラクターページを貼ってください。',
      })
      return
    }
    const characterID = parseInt(matchedCharacterURL![1])
    const characterData = await character.getCharacterInfo(
      req.query.url as string
    )
    if (isLocalError(characterData)) {
      res.status(400)
      res.send(characterData)
      return
    } else {
      const responseData: ResponseData = {
        characterID,
        fetchedDate: new Date(),
        characterData,
        completedAchievementsKinds: [] as CompletedAchievementsKind[],
        isAchievementPrivate: false,
      }
      // FC情報
      let fcInfo: FreecompanyInfo | null = null
      let fcPositionInfo: FreecompanyPositionInfo | null = null

      // キャラクターに付随するアチーブメントデータ取得処理
      const achievementFetchProcesses = Object.entries(KIND)
        .map(async ([key, kind]) => {
          // アチーブメントが公開されてない場合には処理を行わない
          if (responseData.isAchievementPrivate) {
            return
          }
          const achievementKind: CompletedAchievementsKind = {
            key,
            achievements: [],
          }
          const achievementUrl = `${req.query.url}/achievement/kind/${kind.id}`
          const achievementData = await achievement.getAchievement(
            achievementUrl
          )
          if (!isLocalError(achievementData)) {
            achievementKind.achievements.push(...achievementData)
            responseData.completedAchievementsKinds.push(achievementKind)
          } else if (achievementData.key === PRIVATE_ACHIEVEMENT.key) {
            // Errorで PRIVATE_ACHIEVEMENTが帰ってくることは許容範囲
            // アチーブメント情報がPrivateに設定されてる場合にはアチーブメント情報を載せずに返す
            responseData.isAchievementPrivate = true
            return
          } else if (
            achievementData.key === SCRAPING_ERROR.FETCH_LDST_ERROR.key &&
            kind.isSecret
          ) {
            // isSecretのフラグが有効の場合はエラー画面が表示されることを許容する
          } else {
            // それ以外のエラーはBadRequestを返す
            res.status(400)
            res.send(achievementData)
            return
          }
        })
        .concat(
          // FCデータの参照
          (async () => {
            if (!characterData.fcUrlPath) {
              return
            }
            const fcUrl = `${LOADSTONE_URL}${characterData.fcUrlPath}`
            const resFcInfo = await freecompany.getFreeCompanyInfomation(fcUrl)
            if (isLocalError(resFcInfo)) {
              res.status(400)
              res.send(resFcInfo)
              return
            } else {
              fcInfo = resFcInfo
              // MEMO: ユーザ表示数、FF14ロドストが変更された時には同様にここも変える
              const viewUserCount = 50
              // 合計ページ数
              if (fcInfo) {
                const totalMemberPage = Math.ceil(
                  fcInfo.fcMemberCount / viewUserCount
                )
                await Promise.all(
                  [...Array(totalMemberPage)].map(async (_, index) => {
                    const pageNum = index + 1
                    const resFcPositionInfo =
                      await freecompany.getFreeCompanyPositionByName(
                        `${LOADSTONE_URL}${characterData.fcUrlPath}member?page=${pageNum}`,
                        `${characterData.firstName} ${characterData.lastName}`
                      )
                    if (isLocalError(resFcPositionInfo)) {
                      res.status(400)
                      res.send(resFcPositionInfo)
                      return
                    } else if (resFcPositionInfo) {
                      fcPositionInfo = resFcPositionInfo
                    }
                  })
                )
                if (!fcPositionInfo) {
                  res.status(400)
                  res.send({
                    key: 'not_found_user',
                    value: 'FC一覧にユーザーが存在しませんでした。',
                  } as LocalError)
                  return
                }
                responseData.freecompanyInfo = Object.assign(
                  fcInfo,
                  fcPositionInfo
                )
              }
            }
          })()
        )
      await Promise.all(achievementFetchProcesses)
      res.send(responseData)
      return
    }
  } catch (err) {
    res.status(500)
    res.send(err)
    return
  }
})
module.exports = {
  path: '/api',
  handler: app,
}
