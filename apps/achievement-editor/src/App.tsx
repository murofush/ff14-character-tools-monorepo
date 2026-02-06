import { NavLink, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProfileBuilderPage } from './pages/ProfileBuilderPage'

export function App() {
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
