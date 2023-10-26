import { RequestHandler, NextFunction, Response, Request } from 'express'
//! Nhận vào function và có RequestHandler
//?
export const WarpAsync = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
