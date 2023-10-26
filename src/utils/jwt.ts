import jwt from 'jsonwebtoken'
import { buffer } from 'stream/consumers'

//TODO - làm hàm nhận vào payload,privatkey,option
//* từ đó ký tên
//? tại sao không nhận vào callback vì có thể xảy ra bug
//? nenen mình muốn sử dụng hàm callback để xử lý lỗi nên không dùng
export const  signToken = ({
  payload,
  privateKey = process.env.JWT_SECRECT as string,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  privateKey?: string
  options: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) throw reject(err)
      resolve(token as string)
    })
  })
}
