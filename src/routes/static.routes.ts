import { Router } from 'express'
import { serveImageController, serveVideoStreamController } from '~/controllers/medias.controllers'

const staticRouter = Router()
staticRouter.get('/image/:namefile', serveImageController) //chưa code
//vậy route sẽ là localhost:4000/static/image/:namefile
staticRouter.get('/video-stream/:namefile', serveVideoStreamController) //chưa code
export default staticRouter
