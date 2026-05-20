import { Response } from "express"

export const successResponse = <T>(
  res: Response,
  statusCode: number,
  data: T,
) => {
  res.status(statusCode).json({
    success: true,
    data,
    error: null,
  })
}

export const errorResponse = <T>(
  res: Response,
  statusCode: number,
  error: string,
) => {
  res.status(statusCode).json({
    success: false,
    data: null,
    error: { message: error },
  })
}
