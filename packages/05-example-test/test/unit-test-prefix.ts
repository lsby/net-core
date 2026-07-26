import { afterAll } from 'vitest'
import { App } from '../src/app/app'

let server = await new App().run()

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error === void 0 ? resolve() : reject(error)))
  })
})
