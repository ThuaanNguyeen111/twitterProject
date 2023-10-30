import { JwtPayload } from 'jsonwebtoken'
import { UserRoles } from '~/constants/enums'

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirmPassword: string
  date_of_birth: string
}

export interface LoginReqBody {
  email: string
  password: string
}
export interface LogoutResBody {
  refresh_token: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: UserRoles
}

export interface EmailVerifyReqBody {
  email_verify_token: string
}
