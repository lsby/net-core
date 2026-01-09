import { post } from './post'

let _r = await post('/api/calculate-add', { a: 1, b: 2 })
