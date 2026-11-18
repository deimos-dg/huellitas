import { PawPrint } from 'lucide-react'

export function Brand() {
  return (
    <a className="site-brand" href="/#inicio" aria-label="Huellitas de Luz, inicio">
      <span className="brand-icon"><PawPrint size={23} aria-hidden="true" /></span>
      <span className="brand-text">
        <span className="brand-name">Huellitas de Luz</span>
        <span className="brand-credit">Por Patitas Tech</span>
      </span>
    </a>
  )
}
