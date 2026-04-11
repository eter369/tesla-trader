import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LandingHero from './pages/LandingHero.jsx'

const isLanding = window.location.hash === '#landing'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isLanding ? <LandingHero /> : <App />}
  </StrictMode>,
)
