import { JSX } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AboutPage } from '../pages/about/AboutPage'
import { EditCharaCardPage } from '../pages/edit-chara-card/EditCharaCardPage'
import { HomePage } from '../pages/home/HomePage'
import { SelectAchievementPage } from '../pages/select-achievement/SelectAchievementPage'

/** 目的: 画面共通レイアウトとルーティング定義を集約する。副作用: なし。前提: BrowserRouter配下で描画される。 */
export function App(): JSX.Element {
  return (
    <div className="layout">
      <header className="header">
        <h1>CharCard Creator</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/edit-chara-card">Edit Chara Card</Link>
          <Link to="/select-achievement">Select Achievement</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/edit-chara-card" element={<EditCharaCardPage />} />
          <Route path="/editCharaCard" element={<Navigate to="/edit-chara-card" replace />} />
          <Route path="/select-achievement" element={<SelectAchievementPage />} />
          <Route path="/selectAchievement" element={<Navigate to="/select-achievement" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
