import express from 'express'
import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
//! import RunnableValidationChains từ đường link bấm crl + click vào hàm
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'

//!------------------------------------------------------------------------------------------
//?gọi validate bỏ checkschema vào đó và nhận được middlewares và nó sẽ chạy lưu lỗi vào req
//? neus không lỗi thì chạy next nếu có lỗi thì ném respond ra
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
    res.status(400).json({ errors: errors.mapped() })
  }
}
