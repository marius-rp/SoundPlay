import { Request, Response } from "express";
import { playlistService } from "../services/playlist.service";
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper";
import { logger } from "../../utils/logger.helper";

const FILE_NAME = "playlist.controller.ts";

export const getUserPlaylists = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM";
  try {
    if (!userId || userId === "SYSTEM") {
      return errorResponse(res, 401, "Utilisateur non authentifié.");
    }

    const result = await playlistService.getUserPlaylists(userId);

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récupération playlists: ${result.error?.message}`,
      );
      return errorResponse(
        res,
        500,
        result.error?.message ||
          "Erreur lors de la récupération des playlists.",
      );
    }

    return successResponse(res, 200, result.data);
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error);
    return errorResponse(res, 500, "Erreur interne du serveur.");
  }
};

export const createPlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM";
  try {
    if (!userId || userId === "SYSTEM") {
      return errorResponse(res, 401, "Utilisateur non authentifié.");
    }

    const { title, description, cover_image, aleatoire } = req.body;

    if (!title) {
      return errorResponse(
        res,
        400,
        "Le titre de la playlist est obligatoire.",
      );
    }

    const result = await playlistService.createPlaylist({
      user_id: userId,
      title,
      description,
      cover_image,
      aleatoire,
    } as any);

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec création playlist: ${result.error?.message}`,
      );
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur création.",
      );
    }

    logger(userId, FILE_NAME, "INFO", `Nouvelle playlist créée: "${title}"`);
    return successResponse(res, 201, result.data);
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error);
    return errorResponse(res, 500, "Erreur interne du serveur.");
  }
};

export const updatePlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM";
  try {
    const playlistId = parseInt(req.params.id as string, 10);

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.");
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.");

    const { title, description } = req.body;
    let { aleatoire } = req.body;

    if (aleatoire === "true" || aleatoire === "1") aleatoire = true;
    if (aleatoire === "false" || aleatoire === "0") aleatoire = false;

    let cover_image = undefined;
    if (req.file) {
      cover_image = `/storage/cover_playlist/${req.file.filename}?t=${Date.now()}`;
    }

    const result = await playlistService.updatePlaylist(playlistId, userId, {
      title,
      description,
      cover_image,
      aleatoire,
    });

    if (!result.success) {
      const statusCode =
        result.error?.code === "NOT_FOUND_OR_UNAUTHORIZED" ? 403 : 500;
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec mise à jour playlist ${playlistId}`,
      );
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur modification.",
      );
    }

    logger(userId, FILE_NAME, "INFO", `Playlist ${playlistId} mise à jour`);
    return successResponse(res, 200, {
      message: "Playlist mise à jour avec succès.",
      cover_image,
    });
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error);
    return errorResponse(res, 500, "Erreur interne du serveur.");
  }
};

export const deletePlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM";
  try {
    const playlistId = parseInt(req.params.id as string, 10);

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.");
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.");

    const result = await playlistService.deletePlaylist(playlistId, userId);

    if (!result.success) {
      const statusCode =
        result.error?.code === "NOT_FOUND_OR_UNAUTHORIZED" ? 403 : 500;
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression playlist ${playlistId}: ${result.error?.message}`,
      );
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur suppression.",
      );
    }

    logger(
      userId,
      FILE_NAME,
      "WARN",
      `Playlist ${playlistId} supprimée par l'utilisateur`,
    );
    return successResponse(res, 200, {
      message: "Playlist supprimée avec succès.",
    });
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error);
    return errorResponse(res, 500, "Erreur interne du serveur.");
  }
};

export const getPlaylistById = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM";
  try {
    const playlistId = parseInt(req.params.id as string, 10);

    if (isNaN(playlistId)) {
      return errorResponse(res, 400, "ID de playlist invalide.");
    }

    const result = await playlistService.getPlaylistById(playlistId);

    if (!result.success) {
      const statusCode = result.error?.code === "NOT_FOUND" ? 404 : 500;

      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récupération playlist ${playlistId}: ${result.error?.message}`,
      );
      return errorResponse(
        res,
        statusCode,
        result.error?.message ||
          "Erreur lors de la récupération de la playlist.",
      );
    }

    return successResponse(res, 200, result.data);
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error);
    return errorResponse(res, 500, "Erreur interne du serveur.");
  }
};

export const updateAleatoirePlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM";
  try {
    const playlistId = parseInt(req.params.id as string, 10);

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.");
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.");

    const { title, description, cover_image, aleatoire } = req.body;

    const result = await playlistService.updatePlaylist(playlistId, userId, {
      title,
      description,
      cover_image,
      aleatoire,
    });

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec aleatoire à jour playlist ${playlistId}`,
      );
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur modification.",
      );
    }

    logger(userId, FILE_NAME, "INFO", `Playlist ${playlistId} mise à jour`);
    return successResponse(res, 200, {
      message: "Playlist mise à jour avec succès.",
    });
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error);
    return errorResponse(res, 500, "Erreur interne du serveur.");
  }
};
