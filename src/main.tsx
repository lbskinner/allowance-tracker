import { createRoot } from 'react-dom/client'
import './index.css'
import { Root } from './Root'

const path = window.location.pathname
const viewMatch = path.match(/^\/view\/([^/]+)/)
const viewToken = viewMatch ? viewMatch[1] : null

createRoot(document.getElementById('root')!).render(
  <Root viewToken={viewToken} />
)
