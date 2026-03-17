import {
  JSON参数解析插件,
  WebSocket插件,
  常用接口返回器,
  接口,
  接口逻辑,
  计算接口逻辑JSON参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
  集线器监听器宿主,
} from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// WebSocket插件的要求和原理是:
// - 前端先创建一个ws连接, 请求地址为 ws://host/ws?id=<uuid>
// - 等待ws连接建立完成后, 前端请求这个HTTP接口, 在请求头中附带之前生成的 uuid
// - WebSocket插件将读取请求头上的id, 并在框架维护的ws管理器中找到对应的ws句柄, 提供给业务逻辑函数
// 需要说明的是, 这只是内置的"WebSocket插件"的机制和使用示例
// 必须承认, 这个插件的实现还很基础, 很多高级功能并没有实现(因为个人暂无相关高级需求)
// 但这个插件没有任何特殊处理, 框架暴露了内部的ws管理器单例(在"请求附加参数"里), 你完全可以自己写类似的插件, 基于你自己的约定实现这个机制

let 接口路径 = '/api/web-socket-demo' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [
    new JSON参数解析插件(z.object({ a: z.number(), b: z.number() }), {}),
    // 添加"WebSocket插件", 需要传入参数:
    // - 后推前信息描述: 后端推给前端的数据的类型表示
    // - 前推后信息描述: 前端推给后端的数据的类型表示
    // - ws客户端id的请求头名称, 默认为'ws-client-id'
    new WebSocket插件(z.object({ message: z.string() }), z.object({ data: z.string() }), 'ws-client-id'),
    // 可以在这里加入鉴权插件等, 如果鉴权插件返回错误, 则ws也无法拿到数据, 这就复用了HTTP的鉴权功能
  ],
  async (参数, 逻辑附加参数, 请求附加参数) => {
    let _log = 请求附加参数.log

    // 可以获得插件提供的能力
    // 若为null, 表示建立ws连接失败
    let ws操作 = 参数.ws操作

    // 可以监听前端通过ws发来的信息
    // 这个监听, 在不关闭ws句柄的情况下会存在
    // 监听器无需手动释放, 而是基于FinalizationRegistry机制, 但需要注意:
    // - 如果需要在接口返回之后依然有效, 需要在接口生命周期外存在宿主
    // - 即使只想要在接口声明周期中有效, 也需要宿主, 因为V8是通过可达性分析的, 如果不用变量接收, 可能会被过早回收
    // 本例中, 我只想要监听器在接口函数返回前有效, 所以宿主在接口生命周期中定义
    let 监听器宿主 = new 集线器监听器宿主()
    await ws操作?.监听ws信息(async (消息) => {
      await _log.info('收到前端消息:', 消息.data)
    }, 监听器宿主)

    // 可以通过ws给前端推送信息
    let 数据 = ['你', '好', '世', '界']
    for (let 当前数据 of 数据) {
      await ws操作?.发送ws信息({ message: 当前数据 }).catch(() => {})
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 可以主动关闭ws连接
    // await ws操作.关闭ws连接()

    // 可以设置当ws被关闭时(无论是前端主动关闭还是后端主动关闭), 执行一段清理函数
    // await ws操作.设置清理函数(async () => {})

    // 也可以手动释放监听宿主, 避免依赖FinalizationRegistry的不确定性
    监听器宿主.解绑()

    // 同时可以返回正常的HTTP响应
    return new Right({ result: 参数.json.a + 参数.json.b })
  },
  // 接口逻辑是有第三个参数的, 是一个清理函数, 参数是当前接口逻辑的上下文
  // 当接口逻辑抛出错误或返回后, 清理函数就会执行
  // 如果想要接口完成(无论是抛出错误还是返回)后即时释放ws句柄的话, 就可以将关闭逻辑写在这里
  // 如果想要ws句柄不随HTTP连接关闭, 则在这里不要关闭句柄, 而是自己维护ws句柄
  async (参数) => {
    await 参数.ws操作?.关闭ws连接()
  },
)

// 接口逻辑信息预览
type _接口逻辑JSON参数 = 计算接口逻辑JSON参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

// 接口逻辑的错误值, 正确值定义
let 接口错误类型描述 = z.never()
let 接口正确类型描述 = z.object({ result: z.number() })

// 接口返回器定义
let 接口返回器 = new 常用接口返回器(接口错误类型描述, 接口正确类型描述)

// 导出接口
export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
