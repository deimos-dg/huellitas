import { ArrowDown, ArrowRight, HeartHandshake, PawPrint, Plus, ShieldCheck, Sprout } from 'lucide-react'
import heroImage from '../assets/companeros-del-jardin.webp'

const paths = [
  {
    id: 'adopciones',
    title: 'Encuentra un compañero',
    description: 'Los refugios podrán compartir la historia, la personalidad y las necesidades de cada animal. El refugio responsable evaluará cada solicitud de adopción.',
    icon: PawPrint,
  },
  {
    id: 'refugios',
    title: 'Apoya a un refugio',
    description: 'Conoce cómo se destinarán los apoyos a necesidades que publique cada refugio verificado, como alimento, vacunas o atención veterinaria.',
    icon: HeartHandshake,
  },
  {
    id: 'jardin',
    title: 'Haz crecer tu jardín',
    description: 'Cada donación confirmada incorporará una mascota a tu colección virtual. Podrás cuidarla y volver a visitarla cuando quieras.',
    icon: Sprout,
  },
]

const questions = [
  {
    question: '¿Ya puedo hacer una donación?',
    answer: 'Las donaciones aún no están habilitadas. Cuando el servicio abra, podrás consultar el refugio beneficiario y el estado de tu aportación.',
  },
  {
    question: '¿Quién decide si se aprueba una adopción?',
    answer: 'El refugio responsable de cada animal se encargará de revisar las solicitudes y decidir cómo continúa el proceso.',
  },
  {
    question: '¿Cómo conseguiré una mascota virtual?',
    answer: 'Podrás elegir una mascota antes de donar. Una vez confirmada la donación, se añadirá exactamente una mascota a tu colección.',
  },
]

export function HomePage() {
  return (
    <>
      <section className="hero" id="inicio" aria-labelledby="hero-heading" tabIndex={-1}>
        <div className="shell hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span aria-hidden="true" /> Bienestar animal</div>
            <h1 id="hero-heading">Pequeñas huellas,<br /><em>grandes cambios.</em></h1>
            <p className="hero-description">
              Conecta con refugios, descubre historias de adopción y conoce cómo tu apoyo puede hacer la diferencia en la vida de perros y gatos.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#refugios">
                <HeartHandshake size={20} aria-hidden="true" /> Apoya a un refugio
              </a>
              <a className="button button-outline" href="#adopciones">
                Conoce a los animales <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
            <a className="hero-jump" href="#como-funciona">
              <span className="jump-icon"><ArrowDown size={16} aria-hidden="true" /></span>
              Así funciona Huellitas de Luz
            </a>
          </div>
          <figure className="hero-art">
            <img
              src={heroImage}
              alt="Ilustración de un golden retriever y un gato naranja sentados entre flores, frente a una cerca de madera."
              width="1374"
              height="1145"
              fetchPriority="high"
            />
            <figcaption><Sprout size={18} aria-hidden="true" /> El jardín de Huellitas</figcaption>
          </figure>
        </div>
      </section>

      <section className="ways" id="como-funciona" aria-labelledby="ways-heading" tabIndex={-1}>
        <div className="shell">
          <div className="section-heading">
            <h2 id="ways-heading">Tres formas de dejar huella</h2>
            <p>Estamos preparando la galería de adopción, los apoyos a refugios y tu jardín virtual.</p>
          </div>
          <div className="ways-grid grid gap-5 md:grid-cols-3">
            {paths.map(({ id, title, description, icon: Icon }) => (
              <article className="way-card" id={id} key={id} aria-labelledby={`${id}-titulo`} tabIndex={-1}>
                <span className="way-icon"><Icon size={25} strokeWidth={1.75} aria-hidden="true" /></span>
                <h3 id={`${id}-titulo`}>{title}</h3>
                <p>{description}</p>
                {id === 'jardin' && (
                  <>
                    <a className="way-link" href="/jardin">Visita el jardín <ArrowRight size={17} aria-hidden="true" /></a>
                    <a className="way-link" href="/creador">Crea tu mascota <ArrowRight size={17} aria-hidden="true" /></a>
                    <a className="way-link" href="/habitacion">Visita la habitación <ArrowRight size={17} aria-hidden="true" /></a>
                  </>
                )}
              </article>
            ))}
          </div>
          <div className="trust-note">
            <ShieldCheck size={22} aria-hidden="true" />
            <p><strong>Transparencia desde el inicio.</strong> Publicaremos indicadores de impacto cuando tengamos aportaciones confirmadas y datos verificables.</p>
          </div>
        </div>
      </section>

      <section className="faq" id="preguntas" aria-labelledby="faq-heading" tabIndex={-1}>
        <div className="shell faq-inner grid gap-8 md:grid-cols-2">
          <div>
            <h2 id="faq-heading">Preguntas frecuentes</h2>
            <p>Conoce los planes para las donaciones, las adopciones y el jardín.</p>
          </div>
          <div className="questions">
            {questions.map(({ question, answer }) => (
              <details className="question" key={question}>
                <summary>{question}<Plus size={19} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
