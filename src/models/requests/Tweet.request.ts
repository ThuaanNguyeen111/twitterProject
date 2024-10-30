import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '../Other'

//! ĐỊNh nghĩa lại người dùng đăng gì
//? Khi người dùng đăng bài thì họ sẽ truyền lên cái gì
export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string // k là ObjectId vì người dùng chỉ có thể truyền lên string
  hashtags: string[] //người dùng truyền lên dạng string,
  mentions: string[] //mình sẽ convert sang ObjectId sau
  medias: Media[]
}
