import { Router } from 'express'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { loginController, registerController } from '~/controllers/users.controllers'

const usersRouter = Router()

//! usersRouter.use(loginValidator)
usersRouter.get('/login', loginValidator, loginController)

//! register thì cần đẩy dữ liệu lên nên dùng post
/*
   Description: Đăng ký tài khoản
   Path: /api/users/register
   Method: POST
   Body: {
      name: string
      email: string,
      password: string
      confirm_password: string
      date_of_birth: String   || Truyền theo chuẩn ISO 8601
      Tại sao date_of_birth bở vì khi gửi thì gửi dạng json mà json
      không có bất cứ kiểu nào tên là date
   }
*/
usersRouter.post('/register', registerValidator, registerController) //? đăng ký
export default usersRouter
