import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/App'
import { AppSnackbarProvider } from './features/snackbar/context/AppSnackbarContext'
import './app/styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('root要素が見つからないため、アプリを起動できません。')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppSnackbarProvider>
        <App />
      </AppSnackbarProvider>
    </BrowserRouter>
  </React.StrictMode>
)
