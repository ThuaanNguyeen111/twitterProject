import express, { Response, NextFunction, Request } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { omit } from 'lodash'
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
}
//! Lỗi từ các nơi sẽ đổ về đây và không thể
//? tránh khỏi những lỗi không có status
//* quy về lỗi 500
