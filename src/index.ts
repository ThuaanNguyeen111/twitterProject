import express, { Response, NextFunction, Request } from 'express'
import userRouters from './routes/Users.routers'
import DatabaseServices from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import { MongoClient } from 'mongodb'
import tweetsRouter from './routes/tweets.routes'

const app = express()
config()
const port = process.env.PORT || 4000
DatabaseServices.connect().then(() => {
  DatabaseServices.indexUSers()
  DatabaseServices.indexRefreshTokens()
  DatabaseServices.indexFollowers()
})
//thêm
// tạo folder uploads
initFolder()
app.use(express.json()) //? dạy cho app chạy trên kết quả json
app.get('/', (req, res) => {
  res.send('hello world')
})

//! DÙng app để sử dụng hàm usersRouter
//localhost:3000/api/tweets
app.use('/users', userRouters)
app.use('/medias', mediasRouter)
//! CÁCH 1 dùng static file handler
// app.use('/static/video', express.static(UPLOAD_VIDEO_DIR)) //static file handler
//nếu viết như vậy thì link dẫn sẽ là localhost:4000/blablabla.jpg
// app.use('/static', express.static(UPLOAD_DIR)) //nếu muốn thêm tiền tố, ta sẽ làm thế này
//vậy thì nghĩa là vào localhost:4000/static/blablabla.jpg /** */
//!Casch2	dùng router get
app.use('/tweets', tweetsRouter) //route handler
app.use('/static', staticRouter)

app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Project twitter này đang chạy trên post ${port}`)
})
