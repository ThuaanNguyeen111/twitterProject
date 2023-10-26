import express, { Response, NextFunction, Request } from 'express'
import userRouters from './routes/Users.routers'
import DatabaseServices from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
const app = express()
const port = 3000
DatabaseServices.connect()
app.use(express.json()) //? dạy cho app chạy trên kết quả json
app.get('/', (req, res) => {
  res.send('hello world')
})

//! DÙng app để sử dụng hàm usersRouter
//localHost:3000/api/tweets
app.use('/users', userRouters)
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Project twitter này đang chạy trên post ${port}`)
})
