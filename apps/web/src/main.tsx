import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/wght-italic.css'
import './styles/global.css'
import { SiteLayout } from './layouts/SiteLayout'
import { HomePage } from './pages/HomePage'
import { PetCreatorPage } from './pages/PetCreatorPage'

const creatorActive = /^\/creador\/?$/.test(window.location.pathname)
if (creatorActive) document.title = 'Creador de mascotas · Huellitas de Luz'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteLayout creatorActive={creatorActive}>
      {creatorActive ? <PetCreatorPage /> : <HomePage />}
    </SiteLayout>
  </StrictMode>,
)
