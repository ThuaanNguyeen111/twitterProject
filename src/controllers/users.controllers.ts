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
  TokenPayload
} from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import usersRouter from '~/routes/Users.routers'
import HTTP_STATUS from '~/constants/httpStatus'
//!------------------------------------------------------------------------------------------

//!
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  //? lấy user_id từ user của req
  const user = req.user as User
  const user_id = user._id as ObjectId //! lấy từ mongo về nên nó sẽ là object id
  //* dùng user_id để tạo access_token và refresh_token
  const result = await UserServicess.login(user_id.toString())
  //sau khi lấy được res về access_token vàrefresh_token thì gửi về cho client
  res.json({ message: USERS_MESSAGES.LOGIN_SUCCESS, result })
}

//! req: Request<ParamsDictionary, any, RegisterReqBody> --- kiểu dữ liệu của req.body
// params: ParamsDictionary --- kiểu dữ liệu của req.params
// response body : gói hàng sever gửi về trông như thế nào
// response: RegisterReqBody (trong hàm model) kiểu dữ liệu người dùng gửi lên trông thế nào
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  //TODO --- Tạo 1 user mới và bỏ vào collection users trong database
  const result = await UserServicess.register(req.body)
  return res.json({ message: USERS_MESSAGES.REGISTER_SUCCESS, result })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutResBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await UserServicess.logout(refresh_token)
  res.json(result)
}

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
