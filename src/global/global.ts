import { GlobalItem, GlobalService } from '@lsby/ts-global'
import { Log } from '@lsby/ts-log'
import { WebSocket管理器 } from './web-socket-management'

export let Global = new GlobalService([
  new GlobalItem('log', new Log('@lsby:net-core')),
  new GlobalItem('WebSocket管理器', new WebSocket管理器({})),
])
