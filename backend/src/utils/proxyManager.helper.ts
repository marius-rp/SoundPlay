import { HttpsProxyAgent } from "https-proxy-agent"
import pool from "../modules/config/db"
import { proxyService } from "../modules/services/proxy.service"
import { cryptoHelper } from "../utils/crypto.helper"
import { logger } from "./logger.helper"

const FILE_NAME = "proxyManager.helper.ts"

class ProxyManager {
  private proxies: string[] = []
  private currentProxyIndex = 0

  public async init() {
    await this.refreshProxies()
  }

  public async checkAllProxiesHealth() {
    logger(
      "SYSTEM",
      FILE_NAME,
      "INFO",
      "Début du Health Check automatique des proxys...",
    )

    try {
      const [rows]: any = await pool.query("SELECT id FROM proxies")

      for (const proxy of rows) {
        await proxyService.testProxy(proxy.id)
      }

      await this.refreshProxies()
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        "Health Check terminé et cache synchronisé.",
      )
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur lors du Health Check: ${error.message}`,
      )
    }
  }

  public async refreshProxies() {
    try {
      const [rows]: any = await pool.query(
        "SELECT host, port, protocol, username, password FROM proxies WHERE last_status = 'online' AND is_active = 1",
      )

      if (!rows || rows.length === 0) {
        this.proxies = []
        logger(
          "SYSTEM",
          FILE_NAME,
          "WARN",
          "Aucun proxy opérationnel trouvé en base de données.",
        )
        return
      }

      this.proxies = rows.map((p: any) => {
        const rawPassword = cryptoHelper.decrypt(p.password)
        const auth = p.username ? `${p.username}:${rawPassword}@` : ""
        return `${p.protocol || "http"}://${auth}${p.host}:${p.port}`
      })

      this.currentProxyIndex = 0
      logger(
        "SYSTEM",
        FILE_NAME,
        "LOG",
        `Cache synchronisé (${this.proxies.length} proxys actifs en RAM)`,
      )
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur synchronisation BDD vers RAM: ${error.message}`,
      )
    }
  }

  public getAgent() {
    if (this.proxies.length === 0) return null

    const proxyUrl = this.proxies[this.currentProxyIndex]
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length

    return new HttpsProxyAgent(proxyUrl)
  }

  public hasProxies() {
    return this.proxies.length > 0
  }
}

export const proxyManager = new ProxyManager()
