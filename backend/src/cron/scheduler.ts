import { proxyManager } from "../utils/proxyManager.helper"
import { logger } from "../utils/logger.helper"
import { systemService } from "../modules/services/system.service"

const FILE_NAME = "scheduler.ts"

const runEveryXHours = (hours: number, task: () => void) => {
  setInterval(task, hours * 60 * 60 * 1000)
}

export const initSchedulers = () => {
  logger(
    "SYSTEM",
    FILE_NAME,
    "INFO",
    "Initialisation du planificateur natif (Proxys)...",
  )

  runEveryXHours(1, async () => {
    logger(
      "SYSTEM",
      FILE_NAME,
      "LOG",
      "TÂCHE AUTO : Actualisation du cache des proxys",
    )
    await proxyManager.refreshProxies()
  })

  runEveryXHours(6, async () => {
    logger(
      "SYSTEM",
      FILE_NAME,
      "LOG",
      "TÂCHE AUTO : Health Check de tous les proxys",
    )
    await proxyManager.checkAllProxiesHealth()
  })

  runEveryXHours(120, async () => {
    try {
      await systemService.updateAllBinaries()
      logger(
        "SYSTEM",
        FILE_NAME,
        "LOG",
        "TÂCHE AUTO : Téléchargement des binaires",
      )
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        "Erreur lors de la mise à jour des binaires: " + error.message,
      )
    }
  })
}
