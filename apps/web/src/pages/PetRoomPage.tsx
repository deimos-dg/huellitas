import { useEffect, useRef, useState } from 'react'
import { PetRoom } from '../features/pet-motion-2d/scene/PetRoom'
import { gardenScene, originalScenes, playableScenes } from '../features/pet-motion-2d/domain/sceneCatalog'
import '../styles/pet-room.css'

function readSelection() {
  const requested = new URLSearchParams(window.location.search).get('escena')
  const id = requested === 'lounge' ? 'living-room' : requested
  const scene = playableScenes.find(item => item.id === id)
  const unavailable = id && !scene ? originalScenes.find(item => item.id === id)?.name ?? 'El escenario solicitado' : undefined
  return { scene: scene ?? gardenScene, unavailable }
}

export default function PetRoomPage() {
  const [{ scene, unavailable }, setSelection] = useState(readSelection)
  const select = useRef<HTMLSelectElement>(null)
  const restoreFocus = useRef(false)
  useEffect(() => {
    const sync = () => setSelection(readSelection())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  useEffect(() => {
    if (restoreFocus.current) select.current?.focus({ preventScroll: true })
    restoreFocus.current = false
  }, [scene.id])

  return <PetRoom key={scene.id} scene={scene} notice={unavailable && `${unavailable} está pendiente. Se abrió el Jardín principal.`} picker={
    <label className="room-scene-picker">Escenario
      <select ref={select} value={scene.id} onChange={event => {
        const next = playableScenes.find(item => item.id === event.target.value)
        if (!next || next === scene) return
        const url = new URL(window.location.href)
        if (next === gardenScene) url.searchParams.delete('escena')
        else url.searchParams.set('escena', next.id)
        window.history.pushState(null, '', url)
        restoreFocus.current = true
        setSelection({ scene: next, unavailable: undefined })
      }}>
        <optgroup label="Escenarios disponibles">
          {playableScenes.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
        </optgroup>
        <optgroup label="Pendientes de arte">
          {originalScenes.filter(item => item.status === 'pending-art').map(item => <option value={item.id} key={item.id} disabled>{item.name}</option>)}
        </optgroup>
      </select>
    </label>
  } />
}
