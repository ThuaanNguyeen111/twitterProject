import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { USERS_MESSAGES } from '~/constants/message'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import mediasService from '~/services/medias.services'
import fs from 'fs'
import HTTP_STATUS from '~/constants/httpStatus'
import mime from 'mime'
// console.log(__dirname) //log thử để xem
// console.log(path.resolve()) //D:\toturalReact2022\nodejs-backend\ch04-tweetProject
// console.log(path.resolve('uploads')) //D:\toturalReact2022\nodejs-backend\ch04-tweetProject\uploads
export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.uploadImage(req) //vì giờ đã nằm trong mediasService rồi
  return res.json({
    message: USERS_MESSAGES.UPLOAD_IMAGE_SUCCESS,
    result: url
  })
}
//khỏi async vì có đợi gì đâu
export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { namefile } = req.params //lấy namefile từ param string
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, namefile), (error) => {
    console.log(error) //xem lỗi trong như nào, nếu ta bỏ sai tên file / xem xong nhớ cmt lại cho đở rối terminal
    if (error) {
      return res.status((error as any).status).send('File not found')
    }
  }) //trả về file
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.uploadVideo(req) //uploadVideo chưa làm
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  })
}
//khỏi async vì có đợi gì đâu
export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const { namefile } = req.params //lấy namefile từ param string
  const range = req.headers.range //lấy cái range trong headers
  console.log(range)

  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, namefile) //đường dẫn tới file video
  //nếu k có range thì báo lỗi, đòi liền
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Require range header')
  }
  //? Lấy kích thước của video
  //1MB = 10^6 byte (tính theo hệ 10, đây là mình thấy trên đt,UI)
  //tính theo hệ nhị là 2^20 byte (1024*1024)
  //giờ ta lấy dung lượng của video
  //?statSync: đồng bộ hóa việc lấy thông tin file .size: lấy dung lượng file
  const videoSize = fs.statSync(videoPath).size //ở đây tính theo byte
  //dung lượng cho mỗi phân đoạn muốn stream
  //* chunk_size: kích thước mỗi phân đoạn
  const CHUNK_SIZE = 10 ** 6 //10^6 = 1MB
  //lấy giá trị byte bắt đầu từ header range (vd: bytes=8257536-29377173/29377174)
  //8257536 là cái cần lấy
  const start = Number(range.replace(/\D/g, '')) //lấy số đầu tiên từ còn lại thay bằng ''
  // /\D/g: tìm tất cả các kí tự không phải là số
  console.log('start: ', start)

  //lấy giá trị byte kết thúc-tức là khúc cần load đến
  //* end = start + chunk_size
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1) //nếu (start + CHUNK_SIZE) > videoSize thì lấy videoSize
  //dung lượng sẽ load thực tế
  //* không dùng chunk_size vì ở những đoạn cuối
  //* nó sẽ load nhiều hơn dung lượng thực tế
  const contentLength = end - start + 1
  //todo: cài mime để lấy kiểu file
  const contentType = mime.getType(videoPath) || 'video/*' //lấy kiểu file, nếu k đc thì mặc định là video/*
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`, //end-1 vì nó tính từ 0
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers) //trả về phần nội dung
  //khai báo trong httpStatus.ts PARTIAL_CONTENT = 206: nội dung bị chia cắt nhiều đoạn
  const videoStreams = fs.createReadStream(videoPath, { start, end }) //đọc file từ start đến end
  videoStreams.pipe(res)
  //pipe: đọc file từ start đến end, sau đó ghi vào res để gữi cho client
}
