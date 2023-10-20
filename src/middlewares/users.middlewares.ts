//! file này sẽ lưu tất cả middleware của user
//? Một ai đó truy cập vào / login
//? Client sẽ gửi cho mình Email và passwords
//? Tạo 1 body có req có body là email và password
//TODO - Làm 1 middleware để kiểm tra xem Email và Password có được truyền lêm hay không
//? thì cái Email và Password sẽ nằm ở req.body.username
//!------------------------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import UserServicess from '~/services/users.services'
import { validate } from '~/utils/validation'

//?Bắt buộc phải bổ nghĩa ở req ,res và next nếu không sẽ lỗi
//* 3 thằng này là interface cho express cung cấp, thì ta sẽ sử dụng để bổ nghĩa những
//* parameter req, res, next
//------------------------------------------------------

//! KIỂM TRA XEM CÓ PASSWORD HAY EMAIL HAY KHÔNG
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  //? email và cái password được nằm trong body
  const { email, password } = req.body
  //* nêu không có email hay password thì trả respond
  //* 400 là mã lỗi về validator
  if (!email || !password) {
    return res.status(400).json({
      messenger: `Missing Email or passwords`
    })
  }
  next()
}

export const registerValidator = validate(
  checkSchema({
    name: {
      //! search tất cả chức năng trên MD số 4-5
      notEmpty: true, //? xài hàm không cần dấu ()
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      }
    },

    email: {
      notEmpty: true,
      isEmail: true,
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
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 100
        }
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
      errorMessage:
        'Password must be at least 6 characters long, and contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol'
    },

    confirm_password: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 100
        }
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
      errorMessage:
        'Password must be at least 6 characters long, and contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol',
      //! Kiểm tra cố trùng với password hay không
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Passwords do not match')
          }
          return true
        }
      }
    },

    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
)
