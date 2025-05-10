//ở đây thường mình sẽ extend Error để nhận đc báo lỗi ở dòng nào
//! ErrorWithStatus là cấu hình xem lỗi xuất hiện như thế nào
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/message'
type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any //muốn thêm bao nhiêu cũng được
  }
>

export class ErrorWithStatus {
  message: string
  status: number
  //nhận vào 1 lời nhắn và 1 trạng thái sẽ tạo ra 1 object tương ứng
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

//? entytyError là 1 cái class mở rộng từ ErrorWithStatus
//? entityError thay thế cho object error thông báo những lỗi 422
export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
