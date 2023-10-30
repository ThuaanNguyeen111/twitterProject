import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '../models/schemas/users.schemas'
import DatabaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { UserRoles, UserVerifyStatus } from '~/constants/enums'
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
  private signforgotPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: UserRoles.ForgotPasswordToken },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
  }
  //!------------------------------------------------------------------------------------------
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: UserRoles.EmailVerificationToken },
      options: { expiresIn: process.env.EMAIL_VERIFYING_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  //!------------------------------------------------------------------------------------------
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: UserRoles.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  //!------------------------------------------------------------------------------------------
  //! Hàm nhận vào User-id và bỏ vào payload để tạo access token
  //!   refreshToken
  //* vì kí nên hàm này cần bảo mật nên buộc phải private
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: UserRoles.AccessToken },
      options: { expiresIn: process.env.EMAIL_VERIFYING_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }

  //!------------------------------------------------------------------------------------------
  //* HÀM kí tên
  private signAccessRefershToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  //!------------------------------------------------------------------------------------------
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())

    const result = await DatabaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        //!SECTION trong payload mình có password
        //nhưng trong database mình có hash password
        //dùng để độ lại password trong hasmap thành mã hoá
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    //! khi đã tạo ra 1 user thì tạo luôn 1 access token và 1 refresh token

    const [access_token, refresh_token] = await this.signAccessRefershToken(user_id.toString())
    //?------------------------------------------------------------------------------------------
    //TODO: LƯU refresh TOKEN VÀO DATABASE
    await DatabaseService.RefreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    //giả lập gửi mail cái mail_verify_token này cho user
    console.log('email verify' + email_verify_token)
    return { access_token, refresh_token }
  }
  //!------------------------------------------------------------------------------------------
  //? Hàm login
  async login(user_id: string) {
    //* dùng user_id để tạo access_token vàrefresh_token
    const [access_token, refresh_token] = await this.signAccessRefershToken(user_id)
    return { access_token, refresh_token }
  }
  //!------------------------------------------------------------------------------------------
  async logout(refresh_token: string) {
    await DatabaseService.RefreshTokens.deleteOne({ token: refresh_token })
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS }
  }
  //!--------------------------------------------------------------------------------
  async verifyEmail(user_id: string) {
    //khi đăng ký sever cũng sẽ gửi access_token và refresh_token về như login lần dầ
    //? lưu refresh_token vào database và access_token sẽ guiwr cho client
    //* đồng thời tìm users và update lại email_verify_token thành rỗng, verify:1, Updateat: thời gian nào

    const [token] = await Promise.all([
      this.signAccessRefershToken(user_id),
      DatabaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified,
            updated_at: `$$NOW`
          }
        }
      ])
    ])
    const [access_token, refresh_token] = token
    await DatabaseService.RefreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  //!--------------------------------------------------------------------------------
  async resendEmailVerify(user_id: string) {
    //tạo lại email_verify_token
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    //update lại email_verify_token
    await DatabaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          updated_at: `$$NOW`
        }
      }
    ])
  }
  //!-----------------------------------------------------------------------------
  async forgotPassword(user_id: string) {
    //tạo forgot_password_token mới
    const forgot_password_token = await this.signforgotPasswordToken(user_id)
    //TÌM VÀ update lại user bằng forgot_password_token mới và updated_at vào database
    await DatabaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: `$$NOW`
        }
      }
    ])
    //gửi mail cho user
    //thông báo cho user

    //* giả lập gửi mail cái forgot_password_token này cho user
    console.log('forgot password:   ' + forgot_password_token)
    //* thống báo cho user là đã gửi mail thành công
    return { message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD }
  }
}
const UserServicess = new userService()
export default UserServicess
