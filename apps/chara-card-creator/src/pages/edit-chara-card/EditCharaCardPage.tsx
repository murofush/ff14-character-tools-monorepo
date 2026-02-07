import { JSX } from 'react'
import { PageCard } from '../../shared/ui/PageCard'

/** 目的: キャラカード編集画面の移行先プレースホルダーを提供する。副作用: なし。前提: ルート`/edit-chara-card`で表示される。 */
export function EditCharaCardPage(): JSX.Element {
  return (
    <PageCard
      title="Edit Chara Card"
      description="旧 `/editCharaCard` 画面に相当する React SPA のルートです。"
    >
      <p>今後この画面にキャラカード編集 UI を段階的に移植できます。</p>
    </PageCard>
  )
}
