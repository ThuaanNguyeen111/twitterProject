import e, { Router } from 'express'
import {
  accessTokenValidator,
  emailVerifyValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/users.middlewares'
import {
  emailVerifyController,
  forgotPasswordController,
  forgotPasswordverifyForgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController
} from '~/controllers/users.controllers'
import { WarpAsync } from '~/utils/handlers'
import { verify } from 'crypto'
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

/*
  des: resend email verify token
method: POST
headers: (Authorization: Braer <access_token>)
*/

usersRouter.post('/resend-email-verify-token', accessTokenValidator, WarpAsync(resendEmailVerifyController))

/*
 des: forrget password
  *khi người dùng quên mật khẩu, họ cung cấp email cho mình
      ?mình xem có user nào sở hữu email đó không, nếu có thì mình sẽ
      ?tạo 1 forgot_password_token và gửi về email của họ
method: POST
path: /users/forgot-password
body: {email: string}

*/

usersRouter.post('/forgot-password', forgotPasswordValidator, WarpAsync(forgotPasswordController))

/*
 des: verify forgot password token
 người udnfg sau khi báo forgot password thì sẽ nhận được 1 email
 họ vào click vào link trong email đó, link đó sẽ có 1 request đính
 kèm forgot_password_token và gửi lên server /users/verify-forgot-password-token
 mình sẽ verify cái token đó nếu thành công thì mình sẽ cho họ reset password
method: POST
path: /users/verify-forgot-password-token
body: {forgot_password_token: string}
*/
usersRouter.post(
  '/verify-forgot-password-token',
  verifyForgotPasswordValidator,
  WarpAsync(forgotPasswordverifyForgotPasswordController)
)
export default usersRouter
