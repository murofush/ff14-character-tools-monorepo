import { JSX } from 'react'
import { PageCard } from '../../shared/ui/PageCard'

/** 目的: アチーブメント選択画面の移行先プレースホルダーを提供する。副作用: なし。前提: ルート`/select-achievement`で表示される。 */
export function SelectAchievementPage(): JSX.Element {
  return (
    <PageCard
      title="Select Achievement"
      description="旧 `/selectAchievement` 画面に相当する React SPA のルートです。"
    >
      <p>達成項目セレクターの React コンポーネント移植先として利用します。</p>
    </PageCard>
  )
}
