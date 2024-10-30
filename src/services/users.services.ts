import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import User from '../models/schemas/users.schemas'
import DatabaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { UserRoles, UserVerifyStatus } from '~/constants/enums'
import { signToken, verifyToken } from '~/utils/jwt'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Error'
import HTTP_STATUS from '~/constants/httpStatus'
import { Follower } from '~/models/Followers.schema'
import axios from 'axios'

//? khi đụng tới database thì đụng tới service 
class userService {
  private decodeRefreshToken(refresh_token: string) {
    //hàm nhận vào token và secretOrPublicKey sẽ return về payload
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  //!-------------------------------------------------------------------------------------------------------------------
  //hàm này để kiểm tra email đã tồn tại chưa bằng cách tìm trong database qua đường dẫn databaseService.users.findOne
  //findone trả về 1 document nếu tìm thấy, không tìm thấy thì trả về null
  async checkEmailExist(email: string) {
    const result = await DatabaseService.users.findOne({ email })
    return Boolean(result)
    //!SECTION mình ép kiêu boolean để trả ra true hoặc false
  }
  //!---------------------------------------------------------------------------------------------------------------------
  private signforgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: UserRoles.ForgotPasswordToken, verify },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
  }
  //!---------------------------------------------------------------------------------------------------------------------
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: UserRoles.EmailVerificationToken, verify },
      options: { expiresIn: process.env.EMAIL_VERIFYING_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  //!------------------------------------------------------------------------------------------------------------------
  //? nếu không truyền exp thì mặc định là ngay hết hạn mới
  //?
  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      //nếu có thì truyền vào
      return signToken({
        payload: { user_id, token_type: UserRoles.RefreshToken, verify },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string //thêm
      })
    } else {
      return signToken({
        //nếu không thì thêm options expiresIn: số ngày hết hạn
        payload: { user_id, token_type: UserRoles.RefreshToken, verify },
        options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string //thêm
      })
    }
  }

  //!------------------------------------------------------------------------------------------
  //! Hàm nhận vào User-id và bỏ vào payload để tạo access token
  //!   refreshToken
  //* vì kí nên hàm này cần bảo mật nên buộc phải private
  //? signAccessToken nhận vào user_id và verify và định nghĩa type của 2 biến này
  //? sử dụng signToken để kí 
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: UserRoles.AccessToken, verify },
      options: { expiresIn: process.env.EMAIL_VERIFYING_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }

  //!------------------------------------------------------------------------------------------
  //* HÀM kí tên
  private signAccessRefershToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  //!------------------------------------------------------------------------------------------
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    const result = await DatabaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        username: `user${user_id.toString()}`,
        //!SECTION trong payload mình có password
        //nhưng trong database mình có hash password
        //dùng để độ lại password trong hasmap thành mã hoá
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    //! khi đã tạo ra 1 user thì tạo luôn 1 access token và 1 refresh token

    const [access_token, refresh_token] = await this.signAccessRefershToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    //?------------------------------------------------------------------------------------------
    //TODO: LƯU refresh TOKEN VÀO DATABASE
    //khi tạo acc ta sẽ tạo access_token và refresh_token
    //ta liền decode refresh_token vừa tạo để lấy iat và exp
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    //lưu lại refreshToken, iat, exp và collection refreshTokens mới tạo và nhét vào
    await DatabaseService.RefreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    //giả lập gửi mail cái mail_verify_token này cho user
    console.log('Email Verify:  ' + email_verify_token)
    return { access_token, refresh_token }
  }
  //!------------------------------------------------------------------------------------------
  //? Hàm login
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    //* dùng user_id để tạo access_token vàrefresh_token
    const [access_token, refresh_token] = await this.signAccessRefershToken({ user_id, verify })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await DatabaseService.RefreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
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
    const [access_token, refresh_token] = await this.signAccessRefershToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await DatabaseService.RefreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return { access_token, refresh_token }
  }

  //!--------------------------------------------------------------------------------
  async resendEmailVerify(user_id: string) {
    //tạo lại email_verify_token
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })
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
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    //tạo forgot_password_token mới
    const forgot_password_token = await this.signforgotPasswordToken({ user_id, verify })
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
  //!--------------------------------------------------------------------------------
  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    //todo: dựa vào user id để tìm user và update lại password
    await DatabaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: `$$NOW`
        }
      }
    ])
    return { message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS }
  }
  //!--------------------------------------------------------------------------------
  async getMe(user_id: string) {
    const user = await DatabaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )

    return user
  }
  //!--------------------------------------------------------------------------------
  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const __payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    //cập nhật _payload lên db
    const user = await DatabaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) }, //? tìm user có user_id đó
      [
        {
          $set: {
            ...__payload,
            updated_at: `$$NOW`
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 }
      }
    )
    return user
  }
  //!--------------------------------------------------------------------------------
  async getProfile(username: string) {
    const user = await DatabaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          create_at: 0,
          update_at: 0
        }
      }
    )
    if (user === null)
      throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
    return user
  }
  //!--------------------------------------------------------------------------------
  async follow(user_id: string, followed_user_id: string) {
    //kiểm tra xem đã follow hay chưa
    const isFollowed = await DatabaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    //nếu đã follow thì return message là đã follow
    if (isFollowed != null) {
      return {
        message: USERS_MESSAGES.FOLLOWED // trong message.ts thêm FOLLOWED: 'Followed'
      }
    }
    //chưa thì thêm 1 document vào collection followers
    await DatabaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    )
    return {
      message: USERS_MESSAGES.FOLLOW_SUCCESS //trong message.ts thêm   FOLLOW_SUCCESS: 'Follow success'
    }
  }
  //!--------------------------------------------------------------------------------
  async unfollow(user_id: string, followed_user_id: string) {
    //kiểm tra xem đã follow hay chưa
    const isFollowed = await DatabaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    //nếu chưa follow thì return message là chưa follow
    if (!isFollowed) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOW // trong message.ts thêm UNFOLLOWED: 'Unfollowed'
      }
    }
    //chưa thì thêm 1 document vào collection followers
    await DatabaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS //trong message.ts thêm   UNFOLLOW_SUCCESS: 'Unfollow success'
    }
  }
  //!--------------------------------------------------------------------------------
  async changePassword(user_id: string, password: string) {
    //tìm user thông qua user_id
    //cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi
    DatabaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    //nếu bạn muốn ngta đổi mk xong tự động đăng nhập luôn thì trả về access_token và refresh_token
    //ở đây mình chỉ cho ngta đổi mk thôi, nên trả về message
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS // trong message.ts thêm CHANGE_PASSWORD_SUCCESS: 'Change password success'
    }
  }
  //!--------------------------------------------------------------------------------
  async refresh(user_id: string, verify: UserVerifyStatus, refresh_token: string, exp: number) {
    //tạo ra access_token vaf refresh_token mới
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id: user_id, verify }),
      this.signRefreshToken({ user_id: user_id, verify, exp })
    ])

    //vì sợ exp bị trùng param nên ta đổi tên nó, nhưng thật ra 2 đứa nó là 1
    const { iat, exp: oldExp } = await this.decodeRefreshToken(refresh_token)
    await DatabaseService.RefreshTokens.deleteOne({ token: refresh_token }) //xóa refresh
    //insert lại document mới
    await DatabaseService.RefreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token, iat, exp: oldExp })
    )
    return { access_token, refresh_token: new_refresh_token }
  }

  //getOAuthGoogleToken dùng code nhận đc để yêu cầu google tạo id_token
  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID, //khai báo trong .env bằng giá trị trong file json
      client_secret: process.env.GOOGLE_CLIENT_SECRET, //khai báo trong .env bằng giá trị trong file json
      redirect_uri: process.env.GOOGLE_REDIRECT_URI, //khai báo trong .env bằng giá trị trong file json
      grant_type: 'authorization_code'
    }
    //giờ ta gọi api của google, truyền body này lên để lấy id_token
    //ta dùng axios để gọi api `npm i axios`
    const { data } = await axios.post(`https://oauth2.googleapis.com/token`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded' //kiểu truyền lên là form
      }
    }) //nhận đc response nhưng đã rã ra lấy data
    return data as {
      access_token: string
      id_token: string
    }
  }

  //dùng id_token để lấy thông tin của người dùng
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo`, {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    //ta chỉ lấy những thông tin cần thiết
    return data as {
      id: string
      email: string
      email_verified: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  //xài ở oAuth
  async oAuth(code: string) {
    //dùng code lấy bộ token từ google
    const { access_token, id_token } = await this.getOAuthGoogleToken(code)
    const userInfor = await this.getGoogleUserInfo(access_token, id_token)
    //userInfor giống payload mà ta đã check jwt ở trên
    if (!userInfor.email_verified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED, // trong message.ts thêm GMAIL_NOT_VERIFIED: 'Gmail not verified'
        status: HTTP_STATUS.BAD_REQUEST //thêm trong HTTP_STATUS
      })
    }
    //kiểm tra email đã đăng ký lần nào chưa bằng checkEmailExist đã viết ở trên
    const user = await DatabaseService.users.findOne({ email: userInfor.email })
    //nếu tồn tại thì cho login vào, tạo access và refresh token
    if (user) {
      const [access_token, refresh_token] = await this.signAccessRefershToken({
        user_id: user._id.toString(),
        verify: user.verify
      }) //thêm user_id và verify
      //thêm refresh token vào database
      const { iat, exp } = await this.decodeRefreshToken(refresh_token)
      await DatabaseService.RefreshTokens.insertOne(
        new RefreshToken({ user_id: user._id, token: refresh_token, iat, exp })
      )
      return {
        access_token,
        refresh_token,
        new_user: 0, //đây là user cũ
        verify: user.verify
      }
    } else {
      //random string password
      const password = Math.random().toString(36).substring(1, 15)
      //chưa tồn tại thì cho tạo mới, hàm register(đã viết trước đó) trả về access và refresh token
      const data = await this.register({
        email: userInfor.email,
        name: userInfor.name,
        password: password,
        confirmPassword: password,
        date_of_birth: new Date().toISOString()
      })
      return {
        ...data,
        new_user: 1, //đây là user mới
        verify: UserVerifyStatus.Unverified
      }
    }
  }
}
const UserServicess = new userService()
export default UserServicess
