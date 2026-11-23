import { useEffect, useState, useSyncExternalStore } from 'react'
import { DayNightController } from './DayNightController'

export function useDayNight() {
  const [controller] = useState(() => new DayNightController())
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot)

  useEffect(() => {
    const { refresh } = controller
    const interval = window.setInterval(refresh, 1000)
    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    refresh()
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
    }
  }, [controller])

  return { controller, snapshot }
}
