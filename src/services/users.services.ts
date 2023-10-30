import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '../models/schemas/users.schemas'
import DatabaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { UserRoles } from '~/constants/enums'
import { signToken } from '~/utils/jwt'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'

class userService {
  //!------------------------------------------------------------------------------------------
  async checkEmailExist(email: string) {
    const result = await DatabaseService.users.findOne({ email })
    return Boolean(result)
    //!SECTION mình ép kiêu boolean để trả ra true hoặc false
  }

  //!------------------------------------------------------------------------------------------
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: UserRoles.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }

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
  //* HÀM kí tên
  private signAccessRefershToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  //!------------------------------------------------------------------------------------------
  async register(payload: RegisterReqBody) {
    const result = await DatabaseService.users.insertOne(
      new User({
        ...payload,
        //!SECTION trong payload mình có password
        //nhưng trong database mình có hash password
        //dùng để độ lại password trong hasmap thành mã hoá
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    //! khi đã tạo ra 1 user thì tạo luôn 1 access token và 1 refresh token
    const user_id = result.insertedId.toString()
    const [access_Token, refresh_token] = await this.signAccessRefershToken(user_id)
    //?------------------------------------------------------------------------------------------
    //TODO: LƯU refresh TOKEN VÀO DATABASE
    await DatabaseService.RefreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_Token, refresh_token }
  }
  //!------------------------------------------------------------------------------------------
  //? Hàm login
  async login(user_id: string) {
    //* dùng user_id để tạo access_token vàrefresh_token
    const [access_Token, refresh_token] = await this.signAccessRefershToken(user_id)
    return { access_Token, refresh_token }
  }
  //!------------------------------------------------------------------------------------------
  async logout(refresh_token: string) {
    await DatabaseService.RefreshTokens.deleteOne({ token: refresh_token })
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS }
  }
}

const UserServicess = new userService()
export default UserServicess
