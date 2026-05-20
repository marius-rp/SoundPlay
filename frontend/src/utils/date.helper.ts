export const formatDateTime = (dateInput?: string | Date | null): string => {
  if (!dateInput) return "Non disponible"

  try {
    const date = new Date(dateInput)

    if (isNaN(date.getTime())) return "Date invalide"

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    return "Erreur"
  }
}

export const formatDuration = (
  seconds: number | string | undefined | null,
): string => {
  if (seconds === undefined || seconds === null || seconds === "") {
    return "--:--"
  }

  const totalSeconds = Math.max(0, Number(seconds))

  if (isNaN(totalSeconds)) {
    return "--:--"
  }

  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = Math.floor(totalSeconds % 60)

  const paddedMinutes = String(minutes).padStart(2, "0")
  const paddedSeconds = String(remainingSeconds).padStart(2, "0")

  return `${paddedMinutes}:${paddedSeconds}`
}
