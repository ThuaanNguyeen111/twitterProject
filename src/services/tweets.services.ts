import { ObjectId } from 'mongodb'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import DatabaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'

class TweetsService {
  async createTweet(user_id: string, body: TweetRequestBody) {
    //? lưu tweet vào database
    const result = await DatabaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: [], //mình sẽ xử lý logic nó sau, nên tạm thời truyền rỗng
        mentions: body.mentions, //dưa mình string[], mình bỏ trực tiếp vào contructor, nó sẽ convert sang ObjectId[] cho mình
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id) //người tạo tweet
      })
    )

    //lấy tweet vừa tạo ra
    //? lúc đăng thì result sẽ chứa mã id của tweet vừa tạo

    const tweet = await DatabaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }
}

const tweetsService = new TweetsService()
export default tweetsService
