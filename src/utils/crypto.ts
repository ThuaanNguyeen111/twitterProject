import { createHash } from 'crypto'
import { config } from 'dotenv'
config()
//! TẠO 1 hàm nhận vào chuỗi là mã hoá theo chuẩn sha256
function sha256(data: string) {
  return createHash('sha256').update(data).digest('hex')
}

//! hàm nhận vào password và trả về password đã mã hoá
export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRECT)
}
