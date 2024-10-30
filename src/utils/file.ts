import fs from 'fs' //thư viện giúp handle các đường dẫn
import { Request } from 'express'
import formidable, { File } from 'formidable'
import path from 'path'
import { Files } from 'formidable'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'

//!-----------------------------------------------------
//TODO - tạo ra 1 file nếu không có thì tạo ra
export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    //nếu không có đường dẫn 'TwitterProject/uploads' thì tạo ra
    //* thì thằng uploadFolder sẽ null và đi vào if
    if (!fs.existsSync(dir)) {
      //? fs là thư viện của nodejs
      //? existsSync: kiểm tra xem có tồn tại đường dẫn đó không
      //? mkdirSync: tạo thư mục
      fs.mkdirSync(dir, {
        //* nested: lồng vào nhau
        recursive: true //cho phép tạo folder nested vào nhau
        //uploads/image/bla bla bla
      }) //mkdirSync: giúp tạo thư mục
    }
  })
}
//!-----------------------------------------------------
//Hàm xử lý file mà người dùng gửi lên
export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4, //tăng lên
    keepExtensions: true,
    maxFileSize: 300 * 1024,
    maxTotalFileSize: 300 * 1024 * 4, //tổng dung lượng của tất cả các file
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })

  //chỉnh lại return của Promise từ File thành File[]
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      if (!files.image) {
        return reject(new Error('Image is empty'))
      }
      resolve(files.image as File[]) //return về mảng các file luôn
    })
  })
}
//!-----------------------------------------------------
//viết thêm hàm khi nhận filename : abv.png thì chỉ lấy abv để sau này ta gán thêm đuôi .jpeg
//! HÀM LẤY TÊN BỎ ĐUÔI
export const getNameFromFullname = (filename: string) => {
  const nameArr = filename.split('.')
  nameArr.pop() //xóa phần tử cuối cùng, tức là xóa đuôi .png
  return nameArr.join('') //nối lại thành chuỗi
}
//!-----------------------------------------------------
//làm lấy đuôi mở rộng của file bỏ tên
export const getExtension = (filename: string) => {
  const nameArr = filename.split('.')
  return nameArr[nameArr.length - 1]
}
//!-----------------------------------------------------
//Là hàm sử dụng formidable để xử lý file video người dùng gửi lên server
export const handleUploadVideo = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR, //vì video nên mình không đi qua bước xử lý trung gian nên mình sẽ k bỏ video vào temp
    maxFiles: 1, //tối đa bao nhiêu
    // keepExtensions: true, //có lấy đuôi mở rộng không .png, .jpg "nếu file có dạng asdasd.app.mp4 thì lỗi, nên mình sẽ xử lý riêng
    maxFileSize: 50 * 1024 * 1024, //tối đa bao nhiêu byte, 50MB
    //xài option filter để kiểm tra file có phải là video không
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      //nếu sai valid thì dùng form.emit để gữi lỗi
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
        //as any vì bug này formidable chưa fix, khi nào hết thì bỏ as any
      }
      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    //? form.parse: biến req thành dạng formdata để xử lý
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      //files.video k phải image nha
      if (!files.video) {
        return reject(new Error('video is empty'))
      }
      //vì k xài keepExtensions nên file sau khi xử lý xong
      // của mình sẽ k có đuôi mở rộng, mình sẽ rename nó để lắp đuôi cho nó
      const videos = files.video as File[]
      //? vì tên khi gửi lên req sẽ thành ví dụ này ahihi.mp4 ->> dadawdwdadwdad (tên mới)
      //TODO - nên mình sẽ lấy tên mới đó và lấy đuôi mp4 lắp vào nó
      videos.forEach((video) => {
        //* originalFilename: là cái tên sơ khai khi gửi lên
        const ext = getExtension(video.originalFilename as string) //lấy đuôi mở rộng của file cũ
        //filepath là đường dẫn đến tên file mới đã mất đuôi mở rộng do k dùng keepExtensions
        //? ĐỤng đến xoá sửa file thì  dùng đến fs
        //* renameSync: đổi tên file đồng bộ
        fs.renameSync(video.filepath, `${video.filepath}.${ext}`) //rename lại đường dẫn tên file để thêm đuôi
        video.newFilename = video.newFilename + '.' + ext //newFilename là tên file mới đã mất đuôi mở rộng do k dùng keepExtensions
        //lưu lại tên file mới để return ra bên ngoài, thì method uploadVideo khỏi cần thêm đuôi nữa
      })
      return resolve(files.video as File[])
    })
  })
}
