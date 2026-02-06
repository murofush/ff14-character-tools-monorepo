import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AboutPage } from './pages/AboutPage'
import { EditCharaCardPage } from './pages/EditCharaCardPage'
import { HomePage } from './pages/HomePage'
import { SelectAchievementPage } from './pages/SelectAchievementPage'

export function App() {
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
