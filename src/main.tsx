import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from "react-router-dom"
import './index.css'
import App from './App.tsx'

const theRoot = document.getElementById('root')
if (theRoot === null) {
  throw new Error('Missing #root element in index.html')
}

createRoot(theRoot).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
