//! ERROR FUNCTION

import { RequestHandler, NextFunction, Response, Request } from 'express'
//! Nhận vào function và có RequestHandler

export const WarpAsync = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      //? Bởi vì bản thân hàm được sử dụng sử dụng async (cơ bản nó là 1 promise) mà async
      //* throw thì reject , return thì resolve
      // nên nếu sử dụng await ở đây thì hàm bọc nó phải async
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
