import express, { Response, NextFunction, Request } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { omit } from 'lodash'
import { ErrorWithStatus } from '~/models/Error'
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  //*------------------------------------------------------------------
  if (err instanceof ErrorWithStatus) {
    //! LẤY CÁI LỖI CHỤP ĐƯỢC LẤY RA
    //* MÌNH CHẤM OMIT ( NẰM BÊN TRONG LODASH) ĐỂ LẤY RA CÁI LỖI MÀ KHÔNG CÓ STATUS
    return res.status(err.status).json(omit(err, ['status']))
  }
  //! Lỗi từ các nơi sẽ đổ về đây và không thể
  //? tránh khỏi những lỗi không có status
  //* quy về lỗi 500

  //!------------------------------------------------------------------------------------------
  // NẾU MÀ LỖI XUỐNG ĐƯỢC ĐÂY thì nó sẽ là lỗi mặc định (throw new Error-500)
  //* set name, stack và message và Enumerable true
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  //? nếu lỗi xuống dược đây
  //FIXME - nếu mà ở đây dùng res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({message: err.message}) thì nó sẽ không hiển thị được cái lỗi
  //? vì có những lỗi không có message thì chết
  //? thì khi chạy nó sẽ bị undefined
  //? nên phải dùng cái hàm omit để lấy ra cái lỗi mà không có stack
  //? omit là hàm của lodash nên phải cài lodash
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack'])
  })
}
