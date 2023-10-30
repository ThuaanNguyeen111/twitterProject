import { TokenPayload } from './../models/requests/User.requests'
import jwt from 'jsonwebtoken'
import { buffer } from 'stream/consumers'
//
//TODO - làm hàm nhận vào payload,privatkey,option
//* từ đó ký tên
//? tại sao không nhận vào callback vì có thể xảy ra bug
//? nenen mình muốn sử dụng hàm callback để xử lý lỗi nên không dùng
export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  privateKey: string
  options: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) throw reject(err)
      resolve(token as string)
    })
  })
}

//TODO - làm hàm nhận vào token, serectkeyOrPublicKey
export const verifyToken = ({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) => {
  //nếu thành công phải trả rA  jwt.JwtPayload
  return new Promise<TokenPayload>((resolve, reject) => {
    //! hàm call back ở chỗ này sẽ đặc biệt
    // bởi vì nó sẽ trả về 1 decoded (payload) còn thất bại thì trả về 1 (err)
    jwt.verify(token, secretOrPublicKey, (err, decoded) => {
      if (err) throw reject(err)
      resolve(decoded as TokenPayload)
    })
  })
}
