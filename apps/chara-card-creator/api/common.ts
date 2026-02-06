import { LocalError } from '@murofush/forfan-common-package/lib/types'
import https from 'https'

export function getDate(dateScript: string): Date | LocalError {
  const dateScriptRegexp =
    /document.getElementById\('datetime-[\w]+'\).innerHTML = ldst_strftime\((\d+), 'YMD'\);/
  const dateMatched = dateScript.match(dateScriptRegexp)
  if (!dateMatched) {
    return {
      key: 'does_not_matched',
      value: `Class: ${dateScript} からDateの取得に失敗しました。`,
    }
  }
  const dateNumber: number = parseInt(dateMatched[1])
  return new Date(dateNumber * 1000)
}

export async function getBaseImageUrl(
  imageUrl: string
): Promise<string | LocalError> {
  return new Promise((resolve) => {
    https
      .get(imageUrl, (response) => {
        response.setEncoding('base64')
        let body = 'data:' + response.headers['content-type'] + ';base64,'
        response.on('data', (data) => {
          body += data
        })
        response.on('end', () => {
          resolve(body)
        })
      })
      .on('error', (e) => {
        resolve({
          key: 'failed_fetch_image',
          value: e.message,
        } as LocalError)
      })
  })
}
