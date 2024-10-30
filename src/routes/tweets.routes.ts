import { WarpAsync } from '~/utils/handlers'
import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controllers'
import { createTweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifyfiedUserValidator } from '~/middlewares/users.middlewares'

const tweetsRouter = Router()
/*
des: create tweets
method: post
headers: {Authorization: Bearer <access_token>}
body: TweetRequestBody
GET thì sẽ không dùng được các body
khi muốn đăng một bài tweet thì client sẽ gữi lên server một request có body  như 
TweetRequestBody(ta chưa làm) kém theo access_token để biết ai là người đăng bài

*/

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifyfiedUserValidator,
  createTweetValidator,
  WarpAsync(createTweetController)
)

//createTweetValidator và createTweetController ta chưa làm

export default tweetsRouter
