import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/i18n' // 初始化 i18n
import App from './App.tsx'
import { StoreInitializer } from './components/StoreInitializer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreInitializer />
    <App />
  </StrictMode>,
)
