import { post } from './post'

let r = await post('/api/calculate-add', { a: 1, b: 2 })
console.log(r)
