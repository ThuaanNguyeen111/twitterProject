import express, { Response, NextFunction, Request } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { omit } from 'lodash'
import { ErrorWithStatus } from '~/models/Error'
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  //*------------------------------------------------------------------
  //?Note CÁCH HÀM OMIT HOẠT ĐỘNG
  //? - omit là hàm của lodash nên phải cài lodash
  //? - TRÁI NGƯỢC VỚI OMIT LÀ PICK CHỌN CÁC THUỘC TÍNH MUỐN GIỮ LẠI
  //LINK -
  //   {
  //   message: 'Email đã được sử dụng',
  //   status: 409,
  //   code: 'EMAIL_EXISTS'
  //   }
  //! omit(err, ['status'])
  //? RESULT
  // {
  //   message: 'Email đã được sử dụng',
  //   code: 'EMAIL_EXISTS'
  // }

  //!-----------------------------------------------------------------

  //NOTE - nếu mà lỗi do ErrorWithStatus tạo ra
  //! LẤY CÁI LỖI CHỤP ĐƯỢC LẤY RA
  //* MÌNH CHẤM OMIT ( NẰM BÊN TRONG LODASH) ĐỂ LẤY RA CÁI LỖI MÀ KHÔNG CÓ STATUS

  //!------------------------------------------------------------------------------------------

  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']))
  }

  //!------------------------------------------------------------------------------------------
  //! Lỗi từ các nơi sẽ đổ về đây và không thể
  //? tránh khỏi những lỗi không có status
  //* quy về lỗi 500-(BÀI 28) (kHÔNG CÒN NẾU ĐÃ SỬ DỤNG LUÔN ERRORWITHSTATUS BÀI 29)

  //!------------------------------------------------------------------------------------------
  //? nếu lỗi xuống dược đây
  //FIXME - nếu mà ở đây dùng res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({message: err.message}) thì nó sẽ không hiển thị được cái lỗi
  //? vì có những lỗi không có message thì chết
  //? thì khi chạy nó sẽ bị undefined
  //? nên phải dùng cái hàm omit để lấy ra cái lỗi mà không có stack
  //? omit là hàm của lodash nên phải cài lodash
  // NẾU MÀ LỖI XUỐNG ĐƯỢC ĐÂY thì nó không phải là lỗi do Errowwithstatus tạo ra
  //! thì lỗi đó không phải do mình tạo ra ( không có status)
  //* set name, stack và message và Enumerable true đây là lỗi mặc định của js
  //NOTE - getOwnPropertyNames là hàm của js để lấy ra tất cả các thuộc tính của đối tượng
  //NOTE- sẽ lấy ra được cả các thuộc tính enumerable là false
  //NOTE - còn for-in thì sẽ không lấy được
  //NOTE -  defineProperty là hàm của js để định nghĩa lại thuộc tính của đối tượng lại thành true
  //!-------------------------------------------------------------------------------------------

  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack'])
  })
}
//!------------------------------------------------------------------------------------------
