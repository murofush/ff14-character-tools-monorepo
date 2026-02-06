/*
 * !!このd.tsを書き換える場合には、 /common/funciton.tsのType Guard(is関数)も書き換えること。
 */

interface ResponseData {
  characterID: number
  fetchedDate: Date | string
  characterData: CharacterInfo
  isAchievementPrivate: boolean
  completedAchievementsKinds: CompletedAchievementsKind[]
  freecompanyInfo?: FreecompanyPositionInfo & FreecompanyInfo
}

interface CharacterInfo {
  // Tank/Healer
  firstName: string
  lastName: string
  fcUrlPath?: string
  pvpTeamInfo?: PvpTeamInfo
  selfintroduction: string | null
  server: string
  datacenter: string
  race: string
  clan: string
  gender: '♂' | '♀'
  birthDay: string
  birthMonth: string
  // updatedDate: Date
  battleRoles: import('@murofush/forfan-common-package/lib/types').BattleRoles<Level>
  crafter: import('@murofush/forfan-common-package/lib/types').Crafter<Level>
  gatherer: import('@murofush/forfan-common-package/lib/types').Gatherer<Level>
}

interface Level {
  level: number
}

type JobWithLevel = import('@murofush/forfan-common-package/lib/types').Job &
  Level

type IClassWithLevel =
  import('@murofush/forfan-common-package/lib/types').IClass & Level

interface CompletedAchievementsKind {
  key: string
  achievements: CompletedAchievement[]
}

interface CompletedAchievement {
  title: string
  completedDate: Date
}

interface PvpTeamInfo {
  name: string
  crestImageUrls: string[]
}

interface FreecompanyInfo {
  fcName: string
  fcTag: string
  fcMemberCount: number
  fcCrestBaseImageUrls: string[]
  fcHouseState?: string
}

interface FreecompanyPositionInfo {
  positionBaseImageUrl: string
  positionName: string
}

interface Position {
  x: number
  y: number
}

type Color = string

type Theme = 'dark' | 'light'

interface CardColor {
  backgroundColor: Color
  textColor: Color
  accentColor: Color
}

interface AchievementDataWithIndex {
  data: import('@murofush/forfan-common-package/lib/types').CompletedAchievement
  indexes: AchievementIndexPath
}

interface LinkItem {
  title: string
  icon: string
  link?: string
  disabled?: boolean
}

interface FontInfo {
  name: string
  unselectable?: boolean
}

interface checkSyncedKind {
  key: string
  fetchedCategoryIds: string[]
}
