import { ArrowUpRight, Menu, Sprout, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Brand } from '../components/Brand'

const navigation = [
  { label: 'Inicio', href: '/#inicio' },
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Adopciones', href: '/#adopciones' },
  { label: 'Refugios', href: '/#refugios' },
  { label: 'Creador', href: '/creador' },
]

export function SiteLayout({ children, creatorActive = false }: { children: ReactNode; creatorActive?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuToggle = useRef<HTMLButtonElement>(null)

  function closeOnEscape(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && menuOpen) {
      setMenuOpen(false)
      menuToggle.current?.focus()
    }
  }

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="site-header" onKeyDown={closeOnEscape}>
        <div className="shell header-inner">
          <Brand />
          <button
            className="menu-toggle"
            type="button"
            ref={menuToggle}
            aria-expanded={menuOpen}
            aria-controls="navegacion"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <nav className="site-nav" id="navegacion" aria-label="Navegación principal" data-open={menuOpen}>
            <ul className="nav-list">
              {navigation.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} aria-current={creatorActive && href === '/creador' ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>
                </li>
              ))}
            </ul>
            <a className="button button-outline garden-link" href="/#jardin" onClick={() => setMenuOpen(false)}>
              <Sprout size={18} aria-hidden="true" />
              Explora tu jardín
            </a>
          </nav>
        </div>
      </header>
      <main id="contenido" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <Brand />
          <nav className="footer-links" aria-label="Navegación del pie de página">
            <a href="/#como-funciona">Cómo funciona</a>
            <a href="/#preguntas">Preguntas frecuentes</a>
            <a href={creatorActive ? '/#inicio' : '#inicio'}>{creatorActive ? 'Volver al inicio' : 'Volver arriba'} <ArrowUpRight size={15} aria-hidden="true" /></a>
          </nav>
        </div>
      </footer>
    </>
  )
}
