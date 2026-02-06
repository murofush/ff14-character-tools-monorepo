export type TemplateKey = 'fixed' | 'friend' | 'fc'

export type ProfileForm = {
  characterName: string
  world: string
  mainJob: string
  playStyle: string
  playTime: string
  voiceChat: string
  activity: string
  objective: string
  appeal: string
}

export const templateOptions: { key: TemplateKey; label: string }[] = [
  { key: 'fixed', label: '固定募集向け' },
  { key: 'friend', label: 'フレンド募集向け' },
  { key: 'fc', label: 'FC募集向け' },
]

export const playStyles = ['ライト', 'ミドル', '高難易度中心', 'SS撮影/交流中心']

export const templateValues: Record<TemplateKey, Partial<ProfileForm>> = {
  fixed: {
    objective: '零式固定メンバー募集 / 加入希望',
    activity: '零式・絶',
    voiceChat: 'Discord可',
    appeal: '予習復習しっかりやります。相談しやすい雰囲気だと嬉しいです！',
  },
  friend: {
    objective: 'フレンド募集',
    activity: 'ルレ・地図・雑談',
    voiceChat: 'どちらでも',
    appeal: 'まったり遊べる方、気軽にお願いします！',
  },
  fc: {
    objective: 'FC加入希望 / FCメンバー募集',
    activity: '日課・イベント・交流',
    voiceChat: 'なしでもOK',
    appeal: 'IN時間が合う方と楽しく遊びたいです。',
  },
}

export const createInitialForm = (): ProfileForm => ({
  characterName: '',
  world: '',
  mainJob: '',
  playStyle: 'ライト',
  playTime: '',
  voiceChat: '聞き専可',
  activity: '',
  objective: '',
  appeal: '',
})

export const buildProfileText = (
  templateLabel: string,
  form: ProfileForm
): string => {
  const line = (label: string, value: string) => `【${label}】${value || '未入力'}`
  return [
    '# FF14自己紹介',
    `#${templateLabel}`,
    line('キャラクター名', form.characterName),
    line('ワールド/DC', form.world),
    line('メインジョブ', form.mainJob),
    line('プレイスタイル', form.playStyle),
    line('プレイ時間', form.playTime),
    line('VC可否', form.voiceChat),
    line('活動内容', form.activity),
    line('募集目的', form.objective),
    line('ひとこと', form.appeal),
  ].join('\n')
}
