import { JSX } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { HomePage } from '../pages/home/HomePage'
import { ProfileBuilderPage } from '../pages/profile-builder/ProfileBuilderPage'

/** 目的: achievement-editor全体の共通レイアウトとルーティングを定義する。副作用: なし。前提: BrowserRouter配下で描画される。 */
export function App(): JSX.Element {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">FF14 Profile Tools</div>
        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/profile-builder">自己紹介作成</NavLink>
        </nav>
      </header>
      <main className="main-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile-builder" element={<ProfileBuilderPage />} />
        </Routes>
      </main>
    </div>
  )
}
