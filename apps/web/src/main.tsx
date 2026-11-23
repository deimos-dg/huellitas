import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/wght-italic.css'
import './styles/global.css'
import { SiteLayout } from './layouts/SiteLayout'
import { HomePage } from './pages/HomePage'
import { PetCreatorPage } from './pages/PetCreatorPage'

const PetRoomPage = lazy(() => import('./pages/PetRoomPage'))
const GardenPage = lazy(() => import('./pages/GardenPage'))
const pathname = window.location.pathname
const creatorActive = /^\/creador\/?$/.test(pathname)
const roomActive = /^\/habitacion\/?$/.test(pathname)
const gardenActive = /^\/jardin\/?$/.test(pathname)
if (creatorActive) document.title = 'Creador de mascotas · Huellitas de Luz'
if (roomActive) document.title = 'Habitación · Huellitas de Luz'
if (gardenActive) document.title = 'Jardín · Huellitas de Luz'

let page = <HomePage />
if (creatorActive) page = <PetCreatorPage />
if (roomActive) {
  page = (
    <Suspense fallback={<p className="shell" role="status">Cargando la habitación…</p>}>
      <PetRoomPage />
    </Suspense>
  )
}
if (gardenActive) {
  page = (
    <Suspense fallback={<p className="shell" role="status">Cargando el jardín…</p>}>
      <GardenPage />
    </Suspense>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteLayout creatorActive={creatorActive} roomActive={roomActive} gardenActive={gardenActive}>
      {page}
    </SiteLayout>
  </StrictMode>,
)
