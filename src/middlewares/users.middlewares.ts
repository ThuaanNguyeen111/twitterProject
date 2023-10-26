//! file này sẽ lưu tất cả middleware của user
//? Một ai đó truy cập vào / login
//? Client sẽ gửi cho mình Email và passwords
//? Tạo 1 body có req có body là email và password
//TODO - Làm 1 middleware để kiểm tra xem Email và Password có được truyền lêm hay không
//? thì cái Email và Password sẽ nằm ở req.body.username
//!------------------------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { has } from 'lodash'
import { USERS_MESSAGES } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Error'
import DatabaseService from '~/services/database.services'
import UserServicess from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { validate } from '~/utils/validation'

//?Bắt buộc phải bổ nghĩa ở req ,res và next nếu không sẽ lỗi
//* 3 thằng này là interface cho express cung cấp, thì ta sẽ sử dụng để bổ nghĩa những
//* parameter req, res, next
//------------------------------------------------------

//! KIỂM TRA XEM CÓ PASSWORD HAY EMAIL HAY KHÔNG
export const loginValidator = validate(
  checkSchema({
    email: {
      notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
      isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          //! dựa vào email và password tìm đối tượng user tương ứng
          const user = await DatabaseService.users.findOne({
            email: value,
            password: hashPassword(req.body.password)
          })
          if (user === null) {
            throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
          }
          req.user = user
          return true
        }
      }
    },
    password: {
      notEmpty: { errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED },
      isString: { errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING },
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 100
        },
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
      },
      //! kiểm tra độ mạnh password
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
          //? nếu returnScore thì nó sẽ trả ra điểm từ 1-10 để hiện thị độ mạnh passowrd
          //? còn nếu set ở thể false thì nó chỉ trả ra mạnh hay yếu
          returnScore: false
        },
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      },

      errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
    }
  })
)

//ctrl+ tab vào checkSchema để xem cách sử dụng
//để xem checkSchema có những gì
export const registerValidator = validate(
  checkSchema({
    name: {
      //! search tất cả chức năng trên MD số 4-5
      notEmpty: { errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED }, //? xài hàm không cần dấu ()
      isString: { errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        },
        errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
      }
    },

    email: {
      notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
      isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const isExist = await UserServicess.checkEmailExist(value)
          if (isExist) {
            throw new Error('Email already exists')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: { errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED },
      isString: { errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING },
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 100
        },
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
      },
      //! kiểm tra độ mạnh password
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
          //? nếu returnScore thì nó sẽ trả ra điểm từ 1-10 để hiện thị độ mạnh passowrd
          //? còn nếu set ở thể false thì nó chỉ trả ra mạnh hay yếu
          returnScore: false
        },
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      },

      errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
    },

    confirm_password: {
      notEmpty: { errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED },
      isString: { errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING },

      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 100
        },
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
      },
      //! kiểm tra độ mạnh password
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
          //? nếu returnScore thì nó sẽ trả ra điểm từ 1-10 để hiện thị độ mạnh passowrd
          //? còn nếu set ở thể false thì nó chỉ trả ra mạnh hay yếu
          returnScore: false
        }
      },
      errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG,

      //! Kiểm tra cố trùng với password hay không
      custom: {
        //value là giá trị của confirm_password
        options: (value, { req }) => {
          if (value !== req.body.password) {
            //* Quăng lỗi để về sau mình tập kết lỗi
            throw new Error('Passwords do not match')
          }
          //! TODO- Bắt buộc phải return true để kết thúc nêu
          // không sẽ bị kẹt ở đây
          return true
        }
      }
    },

    date_of_birth: {
      isISO8601: {
        options: {
          strict: true, //ép mình nhập đúng định dạng ngày tháng năm
          strictSeparator: true
        }
      },
      errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
    }
  })
)
