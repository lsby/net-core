import { GlobalAsyncItem, GlobalService } from '@lsby/ts-global'
import { Log } from '@lsby/ts-log'
import { WebSocket管理者 } from './ws'

export var Global = new GlobalService([
  new GlobalAsyncItem('log', async () => {
    return new Log('@lsby:net-core')
  }),
  new GlobalAsyncItem('WebSocket管理者', async () => {
    return new WebSocket管理者({})
  }),
])
