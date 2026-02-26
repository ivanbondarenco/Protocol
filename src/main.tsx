import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

const currentPath = window.location.pathname;
const dynamicBasename = currentPath.startsWith('/protocol') ? '/protocol' : '/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={dynamicBasename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
