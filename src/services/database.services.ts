import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb'
//!======================================================================
//* cài dotent  là file cài biến môi trường cho code
// sử dụng bằng các như dưới
import { config } from 'dotenv'
import User from '../models/schemas/users.schemas'
config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetpiedteam.dkffjhj.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri)

class DatabaseServices {
  private client: MongoClient
  private db: Db //? Db thuộc vào mongodb nên phải import

  constructor() {
    this.client = new MongoClient(uri)
    //? gán this db cho để không lập code chỉ cần this.db cho gọn
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      //! throw lỗi để sau này tập kết tất cả các lỗi để xử lý
      throw error
    }
  }

  //? nêu mình không mô tả thì Collection chỉ biết là trả ra Document
  //? nên mình phải mô tả cho Collection bằng cách trả ra các giá trị trong User (Schema)
  get users(): Collection<User> {
    //return table users và người khác có thể sử dụng được
    //! nếu ai bấm database. users thì
    //! họ có  thể sử dụng và có thể ảnh hưởng
    //! trực tiếp lên sever
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }
}
//------------------------------------------------------
//? Mình tạo luôn 1 object từ class ở trên và export nó ra
const DatabaseService = new DatabaseServices()
//? và chỉ cần dùng tên object . tên hàm là sử dụng được
export default DatabaseService
//--------------------------------------------------------
