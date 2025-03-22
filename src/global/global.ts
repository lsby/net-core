import { GlobalAsyncItem, GlobalService } from '@lsby/ts-global'
import { Log } from '@lsby/ts-log'
import { WebSocket管理器 } from './web-socket-management'

export let Global = new GlobalService([
  new GlobalAsyncItem('log', async () => {
    return new Log('@lsby:net-core')
  }),
  new GlobalAsyncItem('WebSocket管理器', async () => {
    return new WebSocket管理器()
  }),
])
