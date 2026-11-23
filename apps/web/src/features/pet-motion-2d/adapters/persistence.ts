import type { PetPose } from '../controllers/PetController'
import { canOccupy } from '../domain/navigation'
import type { StablePosture } from '../domain/petState'
import { petId, restingBedAt, roomId } from '../domain/room'
import { practiceScene } from '../domain/sceneCatalog'
import type { PlayableScene } from '../domain/sceneCatalog'

export const storageKey = 'huellitas.petmotion2d.v1'
const autonomyKey = 'huellitas.petmotion2d.autonomy.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPosture(value: unknown): value is StablePosture {
  return value === 'standing' || value === 'sitting' || value === 'resting' || value === 'lying'
}

function canStorePose(pose: PetPose, scene: PlayableScene) {
  return scene.orientations.includes(pose.facing) && (
    canOccupy(pose.position, scene.navigation)
    || (pose.posture === 'resting' && restingBedAt(scene.objects, pose.position)?.facing === pose.facing)
  )
}

function restore(value: unknown, scene: PlayableScene): PetPose | undefined {
  if (!isRecord(value) || value.version !== 1 || value.petId !== petId || value.roomId !== scene.id) return
  const { position, posture, facing } = value
  if (!isRecord(position) || typeof position.x !== 'number' || typeof position.y !== 'number') return
  const point = { x: position.x, y: position.y }
  if (!isPosture(posture) || (facing !== 'left' && facing !== 'right')) return
  const pose = { position: point, posture, facing } satisfies PetPose
  return canStorePose(pose, scene) ? pose : undefined
}

type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>

export class PetPersistenceService {
  constructor(private readonly getStorage: StorageAccess, private readonly scene: PlayableScene = practiceScene) {}

  private get sceneKey() { return this.scene.id === roomId ? storageKey : `${storageKey}.${this.scene.id}` }

  loadAutonomy() {
    try {
      return this.getStorage().getItem(autonomyKey) !== 'off'
    } catch {
      return true
    }
  }

  saveAutonomy(enabled: boolean) {
    try {
      this.getStorage().setItem(autonomyKey, enabled ? 'on' : 'off')
    } catch {
      // The control still applies to the current session.
    }
  }

  load() {
    try {
      const stored = this.getStorage().getItem(this.sceneKey)
      return stored ? restore(JSON.parse(stored), this.scene) : undefined
    } catch {
      return undefined
    }
  }

  save(pose: PetPose) {
    if (!canStorePose(pose, this.scene)) return
    try {
      this.getStorage().setItem(this.sceneKey, JSON.stringify({ version: 1, petId, roomId: this.scene.id, ...pose }))
    } catch {
      // A denied or full browser storage must leave the room playable in memory.
    }
  }
}
