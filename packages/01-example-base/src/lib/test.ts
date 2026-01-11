import { postJson, postUrlencoded } from './post'

let r1 = await postJson('/api/calculate-add', { a: 1, b: 2 })
console.log(r1)

let r2 = await postUrlencoded('/api/form-submit', { username: 'aaa' })
console.log(r2)
