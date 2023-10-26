import express from 'express'
import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
//! import đường dẫn của RunnableValidationChains bằng cách
//  từ đường link bấm crl + click vào hàm
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { EntityError, ErrorWithStatus } from '~/models/Error'

//!------------------------------------------------------------------------------------------
//?gọi validate bỏ checkschema vào đó và nhận được middlewares và nó sẽ chạy lưu lỗi vào req
//? neus không lỗi thì chạy next nếu có lỗi thì ném respond ra

//* Ban đầu validation(s) sẽ có  s ở đuôi bởi vì bản chất nó là mảng nên phải dùng vòng lặp for các kiểu các kiểu (trên web)
//? ở đây ta sử dụng dành cho checkSchema nên không cần s ở cuối

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //* bởi vì không phải mảng nên bỏ vòng lặp for và bỏ s ở cuối validation
    await validation.run(req)

    const errors = validationResult(req) //* validationResult để lấy và in ra lỗi
    if (errors.isEmpty()) {
      return next()
    }

    //! res.status(400).json({ errors: errors.array() }) không nên sử dụng vì trả ra không đpẹ nên sử dụng
    //! mapped
    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    //! Xử lý errorObject
    //ToDO- Đi qua từng key của errorObject
    for (const key in errorObject) {
      //* Lấy msg của từng lỗi trả ra
      const { msg } = errorObject[key]
      //*nếu cái nào xuất hiện messengers + status và khác 422 thì ném
      //? cho default error handler
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }
      //! TODO_ lưu các 422 từ êrrorObject vào entityError
      entityError.errors[key] = msg
    }

    //? Ở đây nó xử lý lỗi luôn chứ khỔng ném về errorHandler tổng
    next(entityError)
  }
}
