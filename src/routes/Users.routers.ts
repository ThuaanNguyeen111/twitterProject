import { changePasswordValidator, unfollowValidator, verifyfiedUserValidator } from './../middlewares/users.middlewares'
import {
  changePasswordController,
  followController,
  getProfileController,
  oAuthController,
  refreshController,
  unfollowController
} from './../controllers/users.controllers'
import e, { Router } from 'express'
import {
  accessTokenValidator,
  emailVerifyValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/users.middlewares'
import {
  emailVerifyController,
  forgotPasswordController,
  forgotPasswordverifyForgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  updateMeController
} from '~/controllers/users.controllers'
import { WarpAsync } from '~/utils/handlers'
import { verify } from 'crypto'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { filterMiddleware } from '~/middlewares/common.middlewares'
const usersRouter = Router()

//! usersRouter.use(loginValidator)
/**!SECTION
 * DES: Đăng nhập tài khoản
 * PATH: users/login
 * METHOD: GET
 * BODY: {Email: string, Password: string}
 */
usersRouter.post('/login', loginValidator, WarpAsync(loginController))

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

/*
  des: lougout
  path: /users/logout
  method: POST
  Header: {Authorization: Bearer <access_token>}
  body: {refresh_token: string}
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

/*
des: cung cấp email để reset password, gữi email cho người dùng
path: /forgot-password
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
body: {email: string}
*/
usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordValidator,
  WarpAsync(resetPasswordController)
)

/*
des: get profile của user
path: '/me'
method: get
Header: {Authorization: Bearer <access_token>}
body: {}
*/
usersRouter.get('/me', accessTokenValidator, WarpAsync(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifyfiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  updateMeValidator,
  WarpAsync(updateMeController)
)
/*
des: get profile của user khác bằng unsername
path: '/:username'
method: get
không cần header vì, chưa đăng nhập cũng có thể xem
*/
usersRouter.get('/:username', WarpAsync(getProfileController))
//chưa có controller getProfileController, nên bây giờ ta làm

/*
des: Follow someone
path: '/follow'
method: post
headers: {Authorization: Bearer <access_token>}
body: {followed_user_id: string}
Mã id của Tuấn: 654bdc7d3bc7955febae759d
Mã id của Tuấn 2: 654bdd29150fcad21cb6a6ca
*/
usersRouter.post('/follow', accessTokenValidator, verifyfiedUserValidator, followValidator, WarpAsync(followController))

/**
 * Des: Unfollow someone
 * Path: /users/unfollow/:user_id
 * Method: delete (Nó sẽ không cho mình truyền qua body phải qua param)
 * headers: {Authorization: Bearer <access_token>}
 */
usersRouter.delete(
  '/unfollow/:user_id',
  accessTokenValidator,
  verifyfiedUserValidator,
  unfollowValidator,
  WarpAsync(unfollowController)
)

//change password
/*
  des: change password
  path: '/change-password'
  method: PUT
  headers: {Authorization: Bearer <access_token>}
  Body: {old_password: string, password: string, confirm_password: string}
g}
  */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifyfiedUserValidator,
  changePasswordValidator,
  WarpAsync(changePasswordController)
)
//changePasswordValidator kiểm tra các giá trị truyền lên trên body cớ valid k ?

/*
  des: refreshtoken
  path: '/refresh-token'
  method: POST
  Body: {refresh_token: string}
g}
  */
usersRouter.post('/refresh-token', refreshTokenValidator, WarpAsync(refreshController))
//khỏi kiểm tra accesstoken, tại nó hết hạn rồi mà
//refreshController chưa làm

usersRouter.get('/oauth/google', WarpAsync(oAuthController))
export default usersRouter
