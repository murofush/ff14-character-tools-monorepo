import {
  arrayTypeCheck,
  isBattleRoles,
  isCrafter,
  isGatherer,
} from '@murofush/forfan-common-package/lib/function'

export function isResponseCharacterData(arg: any): arg is ResponseData {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    typeof arg.characterID === 'number' &&
    typeof arg.isAchievementPrivate === 'boolean' &&
    isDate(arg.fetchedDate) &&
    arrayTypeCheck(
      arg.completedAchievementsKinds,
      isCompletedAchievementsKind
    ) &&
    isCharacterData(arg.characterData) &&
    (!arg.freecompanyInfo || isFreecompanyInfo(arg.freecompanyInfo))
  )
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

function isCharacterData(arg: any): arg is CharacterInfo {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    typeof arg.firstName === 'string' &&
    typeof arg.lastName === 'string' &&
    (!arg.fcUrlpath || typeof arg.fcUrlPath === 'string') &&
    (!arg.pvpTeamInfo || isPvpTeamInfo(arg.pvpTeamInfo)) &&
    typeof arg.selfintroduction === 'string' &&
    typeof arg.server === 'string' &&
    typeof arg.datacenter === 'string' &&
    typeof arg.race === 'string' &&
    typeof arg.gender === 'string' &&
    (arg.gender === '♂' || arg.gender === '♀') &&
    typeof arg.birthDay === 'string' &&
    typeof arg.birthMonth === 'string' &&
    isBattleRoles(arg.battleRoles, isLevel) &&
    isCrafter(arg.crafter, isLevel) &&
    isGatherer(arg.gatherer, isLevel)
  )
}

function isLevel(arg: any): arg is Level {
  return (
    arg !== null && typeof arg === 'object' && typeof arg.level === 'number'
  )
}

function isString(arg: any): arg is string {
  return arg !== null && typeof arg === 'string'
}

function isPvpTeamInfo(arg: any): arg is PvpTeamInfo {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    typeof arg.name === 'string' &&
    arrayTypeCheck(arg.crestImageUrls, isString)
  )
}

function isCompletedAchievementsKind(
  arg: any
): arg is CompletedAchievementsKind {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    typeof arg.key === 'string' &&
    arrayTypeCheck(arg.achievements, isCompletedAchievement)
  )
}

function isFreecompanyInfo(
  arg: any
): arg is FreecompanyPositionInfo & FreecompanyInfo {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    typeof arg.positionBaseImageUrl === 'string' &&
    typeof arg.positionName === 'string' &&
    typeof arg.fcName === 'string' &&
    typeof arg.fcTag === 'string' &&
    typeof arg.fcMemberCount === 'number' &&
    typeof arrayTypeCheck(arg.fcCrestImageUrls, isString) &&
    (!arg.fcHouseState || typeof arg.fcHouseState === 'string')
  )
}

function isCompletedAchievement(arg: any): arg is CompletedAchievement {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    typeof arg.title === 'string' &&
    isDate(arg.completedDate)
  )
}

function isDate(arg: any): arg is Date {
  return typeof arg === 'string' || arg instanceof Date
}
