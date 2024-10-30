import argv from 'minimist'
const options = argv(process.argv.slice(2))

export const isProduction = Boolean(options.production)
//đoạn này là để chạy ở chế độ production
//nếu là production thì isProduction = true
//nếu là production thì chạy domain của mình
// còn nếu là development thì chạy localhost:3000
