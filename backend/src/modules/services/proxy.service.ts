import { HttpsProxyAgent } from "https-proxy-agent"
import pool from "../config/db"
import { ApiResponse } from "../types/ApiResponse"
import fetch, { RequestInit } from "node-fetch"
import { cryptoHelper } from "../../utils/crypto.helper"
import { logger } from "../../utils/logger.helper"
import { PROXY_TEST_URL } from "../../constant"
import { proxyManager } from "../../utils/proxyManager.helper"

const FILE_NAME = "proxy.service.ts"

const PROXY_TEST_TIMEOUT = 10000

export interface IProxyInput {
  name: string
  host: string
  port: number
  protocol?: string
  username?: string
  password?: string
  provider_url?: string
}

export const proxyService = {
  getAllProxies: async (): Promise<ApiResponse<any[]>> => {
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM proxies ORDER BY created_at DESC",
      )
      return { success: true, data: rows, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getAllProxies: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Impossible de récupérer la liste des proxys.",
        },
      }
    }
  },

  addProxy: async (
    proxy: IProxyInput,
  ): Promise<ApiResponse<{ id: number }>> => {
    try {
      const securedPassword = cryptoHelper.encrypt(proxy.password)

      const sql = `
        INSERT INTO proxies (name, host, port, protocol, username, password, provider_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      const params = [
        proxy.name,
        proxy.host,
        proxy.port,
        proxy.protocol || "http",
        proxy.username || null,
        securedPassword,
        proxy.provider_url || null,
      ]

      const [result]: any = await pool.query(sql, params)

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Nouveau proxy ajouté : ${proxy.name} (ID: ${result.insertId})`,
      )

      return {
        success: true,
        data: { id: result.insertId },
        error: null,
      }
    } catch (error: any) {
      logger("SYSTEM", FILE_NAME, "ERROR", `Erreur addProxy: ${error.message}`)
      return {
        success: false,
        data: null,
        error: {
          code: "DB_INSERT_ERROR",
          message: "Échec de l'enregistrement du proxy.",
        },
      }
    }
  },

  deleteProxy: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const [result]: any = await pool.query(
        "DELETE FROM proxies WHERE id = ?",
        [id],
      )

      if (result.affectedRows === 0) {
        return {
          success: false,
          data: null,
          error: { code: "NOT_FOUND", message: "Ce proxy n'existe pas." },
        }
      }

      logger(
        "SYSTEM",
        FILE_NAME,
        "WARN",
        `Proxy ID ${id} supprimé de la base de données`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur deleteProxy (${id}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_DELETE_ERROR",
          message: "Impossible de supprimer le proxy.",
        },
      }
    }
  },

  getProxyStatusSummary: async (): Promise<{
    total: number
    online: number
  }> => {
    try {
      const [rows]: any = await pool.query(`
        SELECT 
          COUNT(*) as total, 
          SUM(CASE WHEN last_status = 'online' THEN 1 ELSE 0 END) as online 
        FROM proxies
      `)

      return {
        total: rows[0].total || 0,
        online: Number(rows[0].online) || 0,
      }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getProxyStatusSummary: ${error.message}`,
      )
      return { total: 0, online: 0 }
    }
  },

  testProxy: async (id: number) => {
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM proxies WHERE id = ?",
        [id],
      )
      if (rows.length === 0)
        return { success: false, message: "Proxy introuvable" }

      const p = rows[0]
      const rawPassword = cryptoHelper.decrypt(p.password)
      const auth = p.username ? `${p.username}:${rawPassword}@` : ""
      const proxyUrl = `${p.protocol || "http"}://${auth}${p.host}:${p.port}`

      const agent = new HttpsProxyAgent(proxyUrl)

      const options: RequestInit = {
        method: "GET",
        agent: agent,
        timeout: PROXY_TEST_TIMEOUT,
      }

      logger(
        "SYSTEM",
        FILE_NAME,
        "LOG",
        `Lancement du test pour le proxy #${id} (${p.host})`,
      )

      const response = await fetch(String(PROXY_TEST_URL), options)

      let newStatus = "offline"
      let message = "Injoignable via ce proxy."

      if (response.status === 204 || response.ok) {
        newStatus = "online"
        message = "Connexion réussie !"
      } else if (response.status === 429) {
        newStatus = "rate-limited"
        message = "Saturé (429) : YouTube bloque ce proxy."
      }

      await pool.query("UPDATE proxies SET last_status = ? WHERE id = ?", [
        newStatus,
        id,
      ])

      logger(
        "SYSTEM",
        FILE_NAME,
        newStatus === "online" ? "INFO" : "WARN",
        `Résultat test proxy #${id}: ${newStatus}`,
      )

      return { success: newStatus === "online", status: newStatus, message }
    } catch (error: any) {
      await pool.query(
        "UPDATE proxies SET last_status = 'offline' WHERE id = ?",
        [id],
      )
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur testProxy #${id}: ${error.message}`,
      )
      return {
        success: false,
        status: "offline",
        message: `Échec réel : ${error.code || "Vérifiez l'adresse IP"}`,
      }
    }
  },

  toggleProxy: async (
    id: number,
    isActive: boolean,
  ): Promise<ApiResponse<null>> => {
    try {
      const activeValue = isActive ? 1 : 0

      const [result]: any = await pool.query(
        "UPDATE proxies SET is_active = ? WHERE id = ?",
        [activeValue, id],
      )

      if (result.affectedRows === 0) {
        return {
          success: false,
          data: null,
          error: { code: "NOT_FOUND", message: "Ce proxy n'existe pas." },
        }
      }

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Proxy ID ${id} passé à is_active = ${activeValue}`,
      )

      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur toggleProxy (${id}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de modifier le statut du proxy.",
        },
      }
    }
  },

  addBulkProxies: async (
    proxies: IProxyInput[],
  ): Promise<ApiResponse<{ total: number; added: number; failed: number }>> => {
    try {
      let added = 0
      let failed = 0

      for (const proxy of proxies) {
        const res = await proxyService.addProxy(proxy)
        if (res.success) {
          added++
        } else {
          failed++
        }
      }

      return {
        success: true,
        data: { total: proxies.length, added, failed },
        error: null,
      }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur addBulkProxies: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_BULK_INSERT_ERROR",
          message: "Échec de l'importation de masse en base de données.",
        },
      }
    }
  },

  testAllProxies: async (): Promise<
    ApiResponse<{
      total: number
      online: number
      offline: number
      rateLimited: number
    }>
  > => {
    try {
      const [proxies]: any = await pool.query(
        "SELECT id FROM proxies WHERE is_active = 1",
      )

      if (proxies.length === 0) {
        return {
          success: true,
          data: { total: 0, online: 0, offline: 0, rateLimited: 0 },
          error: null,
        }
      }

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Lancement d'un test global pour ${proxies.length} proxys.`,
      )

      let online = 0
      let offline = 0
      let rateLimited = 0

      for (const p of proxies) {
        const res = await proxyService.testProxy(p.id)
        if (res.status === "online") online++
        else if (res.status === "rate-limited") rateLimited++
        else offline++
      }

      if (online > 0) {
        await proxyManager.refreshProxies()
      }

      return {
        success: true,
        data: {
          total: proxies.length,
          online,
          offline,
          rateLimited,
        },
        error: null,
      }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur testAllProxies: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "BULK_TEST_ERROR",
          message:
            "Impossible d'exécuter le diagnostic de masse sur les proxys.",
        },
      }
    }
  },

  updateProxy: async (
    id: number,
    proxy: Partial<IProxyInput>,
  ): Promise<ApiResponse<null>> => {
    try {
      const [rows]: any = await pool.query(
        "SELECT password FROM proxies WHERE id = ?",
        [id],
      )
      if (rows.length === 0) {
        return {
          success: false,
          data: null,
          error: { code: "NOT_FOUND", message: "Proxy introuvable." },
        }
      }

      let securedPassword = rows[0].password
      if (proxy.password && proxy.password.trim() !== "") {
        securedPassword = cryptoHelper.encrypt(proxy.password)
      }

      const sql = `
        UPDATE proxies 
        SET name = ?, host = ?, port = ?, protocol = ?, username = ?, password = ?, provider_url = ?
        WHERE id = ?
      `

      const params = [
        proxy.name,
        proxy.host,
        proxy.port,
        proxy.protocol || "http",
        proxy.username || null,
        securedPassword,
        proxy.provider_url || null,
        id,
      ]

      await pool.query(sql, params)

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Proxy ID ${id} mis à jour avec succès.`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur updateProxy (${id}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de modifier le proxy.",
        },
      }
    }
  },
}
