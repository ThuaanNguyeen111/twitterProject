//!ANCHOR - FILE NÀY ĐỊNH NGHĨA LẠI CÁC REQ TRUYỀN LÊN CHO CLIENT
import { Request } from 'express'
import { User } from '~/models/schemas/users.schemas'
import { TokenPayload } from './models/requests/User.requests'

declare module 'express' {
  interface Request {
    user?: User // trong request có thể có hoặc không có user
    decode_authorization?: TokenPayload
    decode_refresh_token?: TokenPayload
    decode_email_verify_token?: TokenPayload
  }
}
