import { useEffect, useState } from 'react'
import { goldenAnimation } from '../adapters/goldenAnimations'
import { PetPersistenceService } from '../adapters/persistence'
import { PetController } from '../controllers/PetController'
import type { PetIntent } from '../controllers/PetController'
import { PetBehaviorController } from '../controllers/PetBehaviorController'
import { stablePostures } from '../domain/petState'
import type { PlayableScene } from '../domain/sceneCatalog'

export function usePet(scene: PlayableScene) {
  const [{ controller, persistence, behavior }] = useState(() => {
    const persistence = new PetPersistenceService(() => window.localStorage, scene)
    return { persistence, controller: new PetController(goldenAnimation, persistence.load(), scene),
      behavior: new PetBehaviorController(Math.random, undefined, undefined, scene) }
  })
  const [snapshot, setSnapshot] = useState(() => controller.snapshot())
  const [autonomous, setAutonomous] = useState(() => persistence.loadAutonomy())
  const [behaviorPaused, setBehaviorPaused] = useState(false)
  const behaviorActive = autonomous && !behaviorPaused
  const running = behaviorActive || snapshot.state === 'Idle' || snapshot.expressionActive || !stablePostures[snapshot.state]
  const posture = stablePostures[snapshot.state]
  const stablePosition = posture ? snapshot.position : undefined

  useEffect(() => {
    if (posture && stablePosition) persistence.save(controller.poseForStorage())
  }, [controller, persistence, posture, stablePosition])

  useEffect(() => {
    function save() { persistence.save(controller.poseForStorage()) }
    function saveWhenHidden() { if (document.hidden) save() }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', saveWhenHidden)
    return () => {
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', saveWhenHidden)
      save()
    }
  }, [controller, persistence])

  useEffect(() => {
    if (!running) return
    let requestId = 0
    let lastTime: number | undefined
    let nextIdlePaint = 0

    function frame(time: number) {
      if (lastTime !== undefined) {
        const delta = Math.min(time - lastTime, 80)
        const before = controller.snapshot()
        controller.advance(delta)
        const current = controller.snapshot()
        const intent = behaviorActive && !current.expressionActive ? behavior.advance(delta, current) : undefined
        if (intent) controller.requestAutonomous(intent)
        const idlePaint = current.state === 'Idle' && time >= nextIdlePaint
        if (idlePaint) nextIdlePaint = time + 30
        if (idlePaint || intent || before.expressionActive || current.expressionActive || !stablePostures[current.state] || before.state !== current.state) {
          setSnapshot(controller.snapshot())
        }
      }
      lastTime = time
      requestId = requestAnimationFrame(frame)
    }

    function onVisibility() {
      cancelAnimationFrame(requestId)
      lastTime = undefined
      nextIdlePaint = 0
      if (!document.hidden) requestId = requestAnimationFrame(frame)
    }

    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(requestId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [behavior, behaviorActive, controller, running])

  function send(intent: PetIntent) {
    behavior.reset()
    controller.request(intent)
    setSnapshot(controller.snapshot())
  }

  function updateBehavior(enabled: boolean, paused: boolean) {
    behavior.reset()
    if (!enabled || paused) {
      controller.cancelAutonomous()
      setSnapshot(controller.snapshot())
    }
    setAutonomous(enabled)
    setBehaviorPaused(paused)
  }

  return {
    snapshot, send, autonomous, behaviorPaused,
    toggleBehavior: (enabled: boolean) => {
      persistence.saveAutonomy(enabled)
      updateBehavior(enabled, behaviorPaused)
    },
    pauseBehavior: (paused: boolean) => updateBehavior(autonomous, paused),
  }
}
