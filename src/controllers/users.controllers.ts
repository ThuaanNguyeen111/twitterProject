import { register } from 'module'
import { NextFunction, Request, Response } from 'express'
import UserServices from '~/services/database.services'
import User from '../models/schemas/users.schemas'
import DatabaseService from '~/services/database.services'
import UserServicess from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { LoginReqBody, LogoutResBody, RegisterReqBody } from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
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
