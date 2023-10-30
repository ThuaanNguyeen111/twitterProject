import e, { Router } from 'express'
import {
  accessTokenValidator,
  emailVerifyValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import {
  emailVerifyController,
  loginController,
  logoutController,
  registerController
} from '~/controllers/users.controllers'
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

/* 
  des: verify email
  khi người dùng đăng ký, trong email của họ sẽ có 1 link
  trong link này đã setup sẵn 1 request kèm email_verify_token
  thì verify email là cái route cho request đó
  path: /users/verify-email?token=<email_verify_token>
  bởi vì khi mình gửi cho người dùng thì mình không lấy gì về hết nên không xài phương thức get
  mà xài phương thức post
  body: {email_verify_token: string}
*/

usersRouter.post('/verify-email', emailVerifyValidator, WarpAsync(emailVerifyController))

export default usersRouter
