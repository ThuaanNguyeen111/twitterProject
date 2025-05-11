import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb'
//!======================================================================
//* cài dotent  là file cài biến môi trường cho code
// sử dụng bằng các như dưới
import { config } from 'dotenv'
import User from '../models/schemas/users.schemas'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { Follower } from '~/models/Followers.schema'
import Tweet from '~/models/schemas/Tweet.schema'
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

  //!SECTION Sau connect thì mình sẽ truy cập vào Users
  //? nêu mình không mô tả thì Collection chỉ biết là trả ra Document
  //? nên mình phải mô tả cho Collection bằng cách trả ra các giá trị trong User (Schema)
  get users(): Collection<User> {
    //return table users và người khác có thể sử dụng được
    //! nếu ai bấm database. users thì
    //! họ có  thể sử dụng và có thể ảnh hưởng
    //! trực tiếp lên sever
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }
  //!------------------------------------------------------------------------------------------------
  //TODO-HÀM GỌI refresh TOKEN NẾU CẦN
  //? NẾU CHƯA CÓ COLLECTION THÌ MONGOBD TỰ TẠO RỒI ĐƯA CHO MÌNH
  //? NẾU CÓ RỒI THÌ MONGODB SẼ TRẢ RA CHO MÌNH
  get RefreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string)
  }
  //trong file .env thêm DB_FOLLOWERS_COLLECTION = 'followers'

  async indexRefreshTokens() {
    const exists = await this.RefreshTokens.indexExists(['token_1', 'exp_1'])
    if (exists) return
    this.RefreshTokens.createIndex({ token: 1 })
    //đây là ttl index , sẽ tự động xóa các document khi hết hạn của exp
    this.RefreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
  }
  async indexUSers() {
    await this.users.createIndex({ username: 1 }, { unique: true })
    await this.users.createIndex({ email: 1 }, { unique: true })
    await this.users.createIndex({ email: 1, paswword: 1 }, { unique: true })
  }
  async indexFollowers() {
    const exists = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    if (exists) return
    this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
  }
  //trong file index.ts fix lại hàm connect
  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
  }
  //trong đó DB_TWEETS_COLLECTION lưu ở .env là 'tweets'
}
//------------------------------------------------------
//? Mình tạo luôn 1 object từ class ở trên và export nó ra
const DatabaseService = new DatabaseServices()
//? và chỉ cần dùng tên object . tên hàm là sử dụng được
export default DatabaseService
//--------------------------------------------------------
