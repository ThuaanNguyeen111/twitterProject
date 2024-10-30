import { ParamsDictionary } from 'express-serve-static-core'
import { JwtPayload } from 'jsonwebtoken'
import { UserRoles, UserVerifyStatus } from '~/constants/enums'

//TODO - -------------------------------------------------------------------------------------------------------------

//!SECTION Đây là các interface dùng để định nghĩa các kiểu dữ liệu của các request body và params như
//!SECTION các hàm register, login, logout, emailVerify, forgotPassword,
//!resetPassword, updateMe, getProfile, follow, unfollow, changePassword, refreshToken

//? việc làm này để giữ người dùng nhập đúng theo như các kiểu dữ liệu đã định nghĩa không được phép truyền
//? thêm các kiểu dữ liệu khác vào ngoài các kiểu dữ liệu đã định nghĩa
// Toàn bộ các interface dùng để định nghĩa cho req.body và req.params bên trong các hàm controller của user có những gì
// và user sẽ truyền lên những gì tránh việc người dùng truyền thêm các kiểu dữ liệu khác vào
//vd: user truyền lên 1 object có 2 key là name và age thì nó sẽ báo lỗi vì nó chỉ chấp nhận 1 key là name
//vd: tránh để trạng thái verify thành 1  

//REVIEW - Các sử dụng bằng cách vào users.controller.ts và định nghĩa vào req.body

//TODO-----------------------------------------------------------------------------------------------------------------


//?Tại sao toàn bộ các biến trong hàm này đều là string ?
//=> Bởi vì ở đây mình chỉ định nghĩa kiểu dữ liệu của các biến trong req.body và req.params
//=> mà người dùng truyền cho mình thông qua json nên phải là string
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirmPassword: string
  date_of_birth: string
}
//!------------------------------------------------------------------------------------------------
export interface LoginReqBody {
  email: string
  password: string
}
//!------------------------------------------------------------------------------------------------
export interface LogoutResBody {
  refresh_token: string
}
//!------------------------------------------------------------------------------------------------
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: UserRoles
  verify: UserVerifyStatus
  exp: number
  iat: number
}
//!------------------------------------------------------------------------------------------------
export interface EmailVerifyReqBody {
  email_verify_token: string
}

export interface ForgotPasswordReqBody {
  email: string
}
export interface VerifyForgotPasswordTokenReqBody {
  forgot_password_token: string
}

export interface ResetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_assword: string
}
export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string //vì ngta truyền lên string dạng ISO8601, k phải date
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}
//vì đây là route patch nên ngta truyền thiếu 1 trong các prop trên cũng k sao
//! Khi muốn định nghĩa Params thì nên extends ParamsDictionary để có thể dùng được
export interface GetProfileReqParams extends ParamsDictionary {
  username: string
}
export interface FollowReqBody {
  followed_user_id: string
}

export interface UnfollowReqParams extends ParamsDictionary {
  user_id: string
}
export interface ChangePasswordReqBody {
  old_password: string
  password: string
  confirm_password: string
}
export interface RefreshTokenReqBody {
  refresh_token: string
}
