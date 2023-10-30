import { Router } from 'express'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import { WarpAsync } from '~/utils/handlers'
const usersRouter = Router()

//! usersRouter.use(loginValidator)
/**!SECTION
 * DES: Đăng nhập tài khoản
 * PATH: users/login
 * METHOD: GET
 * BODY: {Email: string, Password: string}
 */
usersRouter.get('/login', loginValidator, WarpAsync(loginController))

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
usersRouter.post('/register', registerValidator, WarpAsync(registerController))

/**
 * des:dùng để đăng xuất
 * path: /api/users/logout
 * method: POST
 * headers: {Authorization: 'Bearer <access_token>'}
 * body: {refresh_token: string}
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, WarpAsync(logoutController))

export default usersRouter
