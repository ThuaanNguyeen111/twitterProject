import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '../models/schemas/users.schemas'
import DatabaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { UserRoles } from '~/constants/enums'
import { signToken } from '~/utils/jwt'

class userService {
  //!------------------------------------------------------------------------------------------
  //! Hàm nhận vào User-id và bỏ vào payload để tạo access token
  //!   refreshToken
  //* vì kí nên hàm này cần bảo mật nên buộc phải private
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: UserRoles.AccessToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  }
  //!------------------------------------------------------------------------------------------
  private signRefeshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: UserRoles.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }
  //!------------------------------------------------------------------------------------------
  async checkEmailExist(email: string) {
    const result = await DatabaseService.users.findOne({ email })
    return Boolean(result)
  }
  //!------------------------------------------------------------------------------------------
  async register(payload: RegisterReqBody) {
    const result = await DatabaseService.users.insertOne(
      new User({
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    //! khi đã tạo ra 1 user thì tạo luôn 1 access token và 1 refresh token
    const user_id = result.insertedId.toString()
    const [AccessToken, RefreshToken] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefeshToken(user_id)
    ])
    return { AccessToken, RefreshToken }
  }
}

const UserServicess = new userService()
export default UserServicess
