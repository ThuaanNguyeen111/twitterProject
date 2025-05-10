import { ChangePasswordReqBody, RefreshTokenReqBody, UnfollowReqParams } from './../models/requests/User.requests'
import { verifyToken } from '~/utils/jwt'
import { register } from 'module'
import { NextFunction, Request, Response } from 'express'
import UserServices from '~/services/database.services'
import User from '../models/schemas/users.schemas'
import DatabaseService from '~/services/database.services'
import UserServicess from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  LoginReqBody,
  LogoutResBody,
  RegisterReqBody,
  EmailVerifyReqBody,
  TokenPayload,
  ForgotPasswordReqBody,
  ResetPasswordReqBody,
  UpdateMeReqBody,
  GetProfileReqParams,
  FollowReqBody
} from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import usersRouter from '~/routes/Users.routers'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'
import { verify } from 'crypto'
//!------------------------------------------------------------------------------------------

//!------------------------------------------------------------------------------------------------
//
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  //? lấy user_id từ user của req
  const user = req.user as User
  const user_id = user._id as ObjectId //! lấy từ mongo về nên nó sẽ là object id
  //* dùng user_id để tạo access_token và refresh_token
  const result = await UserServicess.login({ user_id: user_id.toString(), verify: user.verify })
  //sau khi lấy được res về access_token vàrefresh_token thì gửi về cho client
  res.json({ message: USERS_MESSAGES.LOGIN_SUCCESS, result })
}

//!------------------------------------------------------------------------------------------------

//! req: Request<ParamsDictionary, any, RegisterReqBody> --- kiểu dữ liệu của req.body
// params: ParamsDictionary --- kiểu dữ liệu của req.params
// response body : gói hàng sever gửi về trông như thế nào
// response: RegisterReqBody (trong hàm model) kiểu dữ liệu người dùng gửi lên trông thế nào

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  //TODO --- Tạo 1 user mới và bỏ vào collection users trong database
  const result = await UserServicess.register(req.body)
  return res.json({ message: USERS_MESSAGES.REGISTER_SUCCESS, result })
}

//!------------------------------------------------------------------------------------------------
export const logoutController = async (req: Request<ParamsDictionary, any, LogoutResBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await UserServicess.logout(refresh_token)
  res.json(result)
}

//!------------------------------------------------------------------------------------------------
export const emailVerifyController = async (req: Request<ParamsDictionary, any, EmailVerifyReqBody>, res: Response) => {
  //* khi mà req vào được đây nghĩa là emai_verify_token đã valid
  //đồng thời trong req sẽ có decoded.email_verify_token
  const { user_id } = req.decode_email_verify_token as TokenPayload
  const user = await DatabaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.NOT_FOUND
    })
  }
  //? NẾU CÓ USER ĐÓ THÌ MÌNH SẼ KIỂM TRA XEM USER DODS LƯU EMAIL_VERIFY_TOKEN ĐÓ CHƯA
  //* nếu mà tìm dược rồi thì nó sẽ rỗng
  if (user.email_verify_token === '') {
    return res.json({ message: USERS_MESSAGES.EMAIL_ALREADY_REQUIRED })
    //Nếu xuống được đây nghĩa là user này là có nhưng chưa verify
    //? verify email là : tìm user đó và update lại email_verify_token thành rỗng
    //? và verify thành true | 1
  }
  const result = await UserServicess.verifyEmail(user_id)
  return res.json({ message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS, result })
}

//!------------------------------------------------------------------------------------------------
export const resendEmailVerifyController = async (req: Request, res: Response) => {
  // nếu qua được hàm này tức là đã qua được accessTokenValidator
  //req đã có decoded_authoization
  const { user_id } = req.decode_authorization as TokenPayload //tìm user có user_id đó
  const user = await DatabaseService.users.findOne({ _id: new ObjectId(user_id) })
  // nếu không có user có thì res lỗi
  if (user === null) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.NOT_FOUND
    })
  }
  // nếu có thì xem thử nó đã verify chưa
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({ message: USERS_MESSAGES.EMAIL_ALREADY_REQUIRED })
  }
  //nếu mà xuống được đây thì nghĩa là user này chưa verify, và bị mất email_verify_token
  //tiến hành tạo mới email_verify_token và lưu vào database
  const result = await UserServicess.resendEmailVerify(user_id)
  return res.json({ result, message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_TOKEN_SUCCESS })
}

//!------------------------------------------------------------------------------------------------
export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  //* vì đã qua được forgotPasswordValidator nên req sẽ có user
  const { _id, verify } = req.user as User
  //? tiến hành tạo forgot_password_token và lưu vào user đó kèm gửi mail cho user
  const result = await UserServicess.forgotPassword({ user_id: (_id as ObjectId).toString(), verify })
  return res.json({ result })
}

//!------------------------------------------------------------------------------------------------
export const forgotPasswordverifyForgotPasswordController = async (req: Request, res: Response) => {
  res.json({ message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS })
}

//!------------------------------------------------------------------------------------------------
export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  //* Muốn đổi mk thì cần user_id và new_password
  const { user_id } = req.decode_forgot_password_token as TokenPayload
  const { password } = req.body
  //cập nhật cho database
  const result = await UserServicess.resetPassword({ user_id, password })
  return res.json(result)
}

//!------------------------------------------------------------------------------------------------
export const getMeController = async (req: Request, res: Response) => {
  //Muốn lấy profile thì cần access_token co user_id trong đó
  const { user_id } = req.decode_authorization as TokenPayload
  //tìm user có user_id đó
  const user = await UserServicess.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}

//!------------------------------------------------------------------------------------------------
export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  // muốn update cần user_id, và các thông tin cần update
  const { user_id } = req.decode_authorization as TokenPayload
  //khi muốn update thì nó sẽ gửi tất cả trong body
  const { body } = req
  //update lại user
  const result = await UserServicess.updateMe(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result
  })
}

//!------------------------------------------------------------------------------------------------
export const getProfileController = async (req: Request<GetProfileReqParams, any, any>, res: Response) => {
  // tìm user theo username
  const { username } = req.params
  const user = await UserServicess.getProfile(username)
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}

//!------------------------------------------------------------------------------------------------
export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayload //lấy user_id từ decoded_authorization của access_token
  const { followed_user_id } = req.body //lấy followed_user_id từ req.body
  const result = await UserServicess.follow(user_id, followed_user_id) //chưa có method này
  return res.json(result)
}

//!------------------------------------------------------------------------------------------------
export const unfollowController = async (
  req: Request<UnfollowReqParams, any, any>,
  res: Response,
  next: NextFunction
) => {
  //Muốn đi tìm người muốn unfollow thì cần phải biết mình là ai , mình follow ai
  // lấy ra user_id là người muốn thực hiện unfollow

  const { user_id } = req.decode_authorization as TokenPayload
  //* lấy ra người muốn unfollow lấy ở params
  const { user_id: followed_user_id } = req.params
  const result = await UserServicess.unfollow(user_id, followed_user_id)
  return res.json(result)
}

//!------------------------------------------------------------------------------------------------
export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayload //lấy user_id từ decoded_authorization của access_token
  const { password } = req.body //lấy old_password và password từ req.body
  const result = await UserServicess.changePassword(user_id, password) //chưa code changePassword
  return res.json(result)
}

//!------------------------------------------------------------------------------------------------
export const refreshController = async (req: Request<ParamsDictionary, any, RefreshTokenReqBody>, res: Response) => {
  const { refresh_token } = req.body
  //Mã và trạng thái của cái account đó
  const { user_id, verify, exp } = req.decode_refresh_token as TokenPayload
  const result = await UserServicess.refresh(user_id, verify, refresh_token, exp)
  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

//!------------------------------------------------------------------------------------------------
export const oAuthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const { access_token, refresh_token, new_user } = await UserServicess.oAuth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${access_token}&refresh_token=${refresh_token}&new_user=${new_user}`
  return res.redirect(urlRedirect)
}
//!------------------------------------------------------------------------------------------------
