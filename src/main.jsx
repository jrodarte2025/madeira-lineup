import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MadeiraLineupPlanner from './MadeiraLineupPlanner.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MadeiraLineupPlanner />
  </StrictMode>,
)
