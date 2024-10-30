import { Router } from 'express'
import { uploadSingleImageController, uploadVideoController } from '../controllers/medias.controllers'
import { WarpAsync } from '~/utils/handlers'
import { accessTokenValidator, verifyfiedUserValidator } from '~/middlewares/users.middlewares'
const mediasRouter = Router()

mediasRouter.post('/upload-image', WarpAsync(uploadSingleImageController))
mediasRouter.post('/upload-video', accessTokenValidator, verifyfiedUserValidator, WarpAsync(uploadVideoController)) // uploadVideoController chưa làm
export default mediasRouter

//uploadSingleImageController chưa làm
