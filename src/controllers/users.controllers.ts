import { register } from 'module'
import { Request, Response } from 'express'
import UserServices from '~/services/database.services'
import User from '../models/schemas/users.schemas'
import DatabaseService from '~/services/database.services'
import UserServicess from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
//!------------------------------------------------------------------------------------------

//!
export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'test@gmail.com' && password === '123456') {
    res.json({
      message: 'login successfully',
      result: [
        { name: 'Điệp', yob: 1999 },
        { name: 'Hùng', yob: 2003 },
        { name: 'Được', yob: 1994 }
      ]
    })
  } else {
    res.status(400).json({
      message: 'login failed'
    })
  }
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    //TODO --- Tạo 1 user mới và bỏ vào collection users trong database
    const result = await UserServicess.register(req.body)
    return res.json({ message: ' register Successfully', result })
  } catch (error) {
    return res.status(400).json({ message: 'Failed', error })
  }
}
