export const idleDurationMs = 15_500
const breathDurationMs = 3100
const blinkStartsMs = [2850, 6560, 6820, 11_450]

export function sampleIdleMotion(elapsed: number, reducedMotion: boolean) {
  if (reducedMotion) return { breathOffset: 0, blinking: false }
  const phase = elapsed % idleDurationMs
  const breath = (1 - Math.cos(2 * Math.PI * (phase % breathDurationMs) / breathDurationMs)) / 2
  const blinking = blinkStartsMs.some(start => phase >= start && phase < start + 125)
  return { breathOffset: .012 * breath, blinking }
}
