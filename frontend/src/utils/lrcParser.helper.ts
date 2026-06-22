export interface LyricLine {
  time: number
  text: string
}

export function parseLRC(raw: string): LyricLine[] {
  if (!raw) return []

  const lines = raw.split(/\r?\n/)
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  const parsed: LyricLine[] = []
  let hasTimestamps = false

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    const text = line.replace(timeRegex, "").trim()

    if (matches.length === 0) {
      if (text) parsed.push({ time: -1, text })
      continue
    }

    hasTimestamps = true
    for (const match of matches) {
      const [, min, sec, ms] = match
      const msNormalized = ms.length === 2 ? `${ms}0` : ms
      const time =
        parseInt(min, 10) * 60 +
        parseInt(sec, 10) +
        parseInt(msNormalized, 10) / 1000
      if (text) parsed.push({ time, text })
    }
  }

  if (!hasTimestamps) return parsed

  return parsed.filter((l) => l.time >= 0).sort((a, b) => a.time - b.time)
}

export function getActiveLyricIndex(
  lines: LyricLine[],
  currentTime: number,
): number {
  if (lines.length === 0) return -1

  let activeIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) {
      activeIndex = i
    } else {
      break
    }
  }
  return activeIndex
}

export function isSyncedLyrics(lines: LyricLine[]): boolean {
  return lines.length > 0 && lines[0].time >= 0
}
