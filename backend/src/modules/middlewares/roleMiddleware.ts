import { Request, Response, NextFunction } from "express"

export const authorizeRoles = (allowedRoleIds: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoleId = (req as any).user?.role_id

    if (!userRoleId || !allowedRoleIds.includes(userRoleId)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
        },
      })
    }
    next()
  }
}
