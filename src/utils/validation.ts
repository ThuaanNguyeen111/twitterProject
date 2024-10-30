import express from 'express'
import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
//! Import đường dẫn của RunnableValidationChains bằng cách
//    từ đường link bấm Ctrl + Click vào hàm
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { EntityError, ErrorWithStatus } from '~/models/Error'

//!------------------------------------------------------------------------------------------

//? Gọi validate bỏ checkSchema vào đó và nhận được middlewares, nó sẽ lưu lỗi vào req
//? Nếu không lỗi thì chạy next, nếu có lỗi thì trả về response
//* Ban đầu validation(s) có 's' ở đuôi bởi vì nó là mảng nên phải dùng vòng lặp (trên web)
//? Ở đây sử dụng cho checkSchema nên không cần 's' ở cuối
//? hàm validate này thuộc express-validator  và chính bản thân nó là 1 middleware

//!------------------------------------------------------------------------------------------
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //* Vì không phải mảng nên bỏ vòng lặp và 's' ở cuối validation
    await validation.run(req) //! Chạy qua từng validation và kiểm tra lỗi

    const errors = validationResult(req) //* Lấy và in ra lỗi nếu có
    if (errors.isEmpty()) {
      return next()
    }

    //! res.status(400).json({ errors: errors.array() }) không nên sử dụng vì trả lỗi không đẹp
    //! Mapped() giúp hiện các lỗi đẹp hơn khi test trên Postman
    //! giúp gộp res về thành 1 object báo lỗi thôi, thay vì mảng báo từng lỗi
    //* Tinh chỉnh lại mapped() để hiển thị lỗi theo ý muốn

    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })

    //!-----------------------------------------------
    //! Xử lý errorObject
    //ToDO- Đi qua từng key của errorObject
    for (const key in errorObject) {
      //* Lấy msg của từng lỗi trả ra
      const { msg } = errorObject[key]

      //* Nếu xuất hiện messengers + status và khác 422 thì ném
      //? Đưa về default error handler
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }
      //! TODO - Lưu các lỗi 422 từ errorObject vào entityError
      entityError.errors[key] = msg
    }

    //? Xử lý lỗi luôn, không ném về errorHandler tổng
    next(entityError)
  }
}

//!SECTION Phần dành cho validate để checkSchema thông báo lỗi nếu người dùng nhập sai thông tin
