import { ArrowLeft, ArrowRight, Cat, Dog, Eye, PawPrint } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { coats, collars, variants } from '../features/pets/catalog'
import type { Coat, Collar, PetId, Species } from '../features/pets/catalog'
import { PetPreview } from '../features/pets/PetPreview'
import { PetPortrait } from '../features/pets/PetSprite'
import '../styles/pet-creator.css'

const speciesOptions = [
  { id: 'dog', name: 'Perro', icon: Dog },
  { id: 'cat', name: 'Gato', icon: Cat },
] as const

type Draft = {
  species: Species
  variant: PetId
  name: string
  coat: Coat
  collar: Collar
}

const initialDraft: Draft = { species: 'dog', variant: 'golden', name: '', coat: 'natural', collar: 'original' }

export function PetCreatorPage() {
  const [draft, setDraft] = useState(initialDraft)
  const [reviewing, setReviewing] = useState(false)
  const [nameError, setNameError] = useState(false)
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const returningToForm = useRef(false)
  const availableVariants = variants[draft.species]
  const variant = availableVariants.find((item) => item.id === draft.variant) ?? availableVariants[0]
  const coatLabel = variant.id === 'sphynx' ? 'Tono de piel' : 'Tono del pelaje'

  useEffect(() => {
    if (reviewing) {
      reviewHeading.current?.focus()
    } else if (returningToForm.current) {
      returningToForm.current = false
      nameInput.current?.focus()
    }
  }, [reviewing])

  function chooseSpecies(species: Species) {
    setDraft((current) => ({ ...current, species, variant: variants[species][0].id }))
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = draft.name.trim()
    if (!name) {
      setNameError(true)
      nameInput.current?.focus()
      return
    }
    setDraft((current) => ({ ...current, name }))
    setReviewing(true)
  }

  return (
    <section className="creator-page" aria-labelledby="creator-heading">
      <div className="shell">
        <div className="creator-heading">
          <a href="/#inicio" className="creator-back"><ArrowLeft size={17} aria-hidden="true" /> Inicio</a>
          <h1 id="creator-heading">Crea tu mascota</h1>
          <p>Elige una variante, ponle un nombre y personaliza su apariencia.</p>
        </div>

        <div className="creator-grid">
          <PetPreview key={variant.id} variant={variant} name={draft.name} coat={draft.coat} collar={draft.collar} />
          {reviewing ? (
            <section className="creator-panel creator-review" aria-labelledby="review-heading">
              <div className="review-icon"><PawPrint size={27} aria-hidden="true" /></div>
              <h2 id="review-heading" ref={reviewHeading} tabIndex={-1}>Revisa tu mascota</h2>
              <dl className="pet-summary">
                <div><dt>Nombre</dt><dd>{draft.name}</dd></div>
                <div><dt>Especie</dt><dd>{draft.species === 'dog' ? 'Perro' : 'Gato'}</dd></div>
                <div><dt>Variante</dt><dd>{variant.name}</dd></div>
                <div><dt>{coatLabel}</dt><dd>{coats[draft.coat].name}</dd></div>
                <div><dt>Collar</dt><dd>{collars[draft.collar].name}</dd></div>
              </dl>
              <p>Tu selección es una vista previa. Las mascotas se incorporarán al jardín cuando se pueda confirmar una donación.</p>
              <button className="button button-outline" type="button" onClick={() => {
                returningToForm.current = true
                setReviewing(false)
              }}><ArrowLeft size={18} aria-hidden="true" /> Volver a editar</button>
            </section>
          ) : (
            <form className="creator-panel creator-form" noValidate onSubmit={review}>
              <fieldset>
                <legend>Especie</legend>
                <div className="species-choices">
                  {speciesOptions.map(({ id, name, icon: Icon }) => (
                    <label className="creator-choice" key={id}>
                      <input type="radio" name="species" value={id} checked={draft.species === id} onChange={() => chooseSpecies(id)} />
                      <span className="choice-surface"><Icon size={22} aria-hidden="true" /> {name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Raza o variante</legend>
                <div className="variant-choices">
                  {availableVariants.map((option) => (
                    <label className="creator-choice" key={option.id}>
                      <input
                        type="radio" name="variant" value={option.id} checked={variant.id === option.id}
                        onChange={() => setDraft((current) => ({ ...current, variant: option.id }))}
                      />
                      <span className="choice-surface variant-choice">
                        <PetPortrait id={option.id} />
                        <span>{option.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="personalize">
                <div className="name-field">
                  <label htmlFor="pet-name">Nombre</label>
                  <input
                    id="pet-name" ref={nameInput} type="text" maxLength={28} required
                    value={draft.name} autoComplete="off" placeholder="Ej. Nala"
                    aria-invalid={nameError || undefined} aria-describedby={nameError ? 'name-error' : undefined}
                    onChange={(event) => {
                      setNameError(false)
                      setDraft({ ...draft, name: event.target.value })
                    }}
                  />
                  {nameError && <p className="field-error" id="name-error" role="alert">Escribe un nombre para revisar tu mascota.</p>}
                </div>

                <fieldset>
                  <legend>{coatLabel}</legend>
                  <div className="coat-choices">
                    {Object.entries(coats).map(([value, option]) => (
                      <label className="creator-choice" key={value}>
                        <input
                          type="radio" name="coat" value={value} checked={draft.coat === value}
                          onChange={() => setDraft((current) => ({ ...current, coat: value as Coat }))}
                        />
                        <span className="choice-surface">{option.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Color del collar</legend>
                  <div className="collar-choices">
                    {Object.entries(collars).map(([value, option]) => (
                      <label className="creator-choice" key={value}>
                        <input
                          type="radio" name="collar" value={value} checked={draft.collar === value}
                          onChange={() => setDraft((current) => ({ ...current, collar: value as Collar }))}
                        />
                        <span className="collar-choice choice-surface">
                          <span className="color-swatch" style={option.color ? { background: option.color } : undefined} aria-hidden="true" />
                          {option.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="creator-actions">
                <a className="button button-outline preview-shortcut" href="#vista-previa"><Eye size={17} aria-hidden="true" /> Ver vista previa</a>
                <button className="button button-primary" type="submit">Revisar mascota <ArrowRight size={18} aria-hidden="true" /></button>
              </div>
            </form>
          )}

        </div>
      </div>
    </section>
  )
}
