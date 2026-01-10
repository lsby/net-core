import {
  JSON参数解析插件,
  常用接口返回器,
  接口,
  接口逻辑,
  计算接口逻辑JSON参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
} from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'
import { ObjectSchemaZod } from './schema/zod'

// =======================
// 输入json schema接口
// =======================
// 这个示例展示了:
// - 如何编写接收json schema的参数
// - 如何让复杂类型正常生成类型文件

// 对于复杂类型, 尤其是递归引用类型, lsby-net-core-gen-api-type生成的类型可能会有问题
// 因为递归引用类型必须要通过中间变量才能实现
// 框架内置了"NetCoreExportType"类型, 允许通过这种方式导出单独的类型定义
// NetCoreExportType类型有两个参数:
// - Name: 导出的名字
// - T: 导出的类型
// 然后将其作为文件的默认导出即可
// 例如, 如果某文件默认导出了NetCoreExportType<"A", string>
// 使用lsby-net-core-gen-api-type生成的类型就会包含一句 type A = string

let 接口路径 = '/api/structure/add' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.空逻辑().绑定(
  接口逻辑.构造(
    [new JSON参数解析插件(z.object({ data: ObjectSchemaZod }), {})],
    async (参数, 附加参数, 请求附加参数) => {
      let log = 请求附加参数.log.extend(接口路径)
      await log.debug('收到的数据: %o', 参数.json)
      return new Right({})
    },
  ),
)

type _接口逻辑JSON参数 = 计算接口逻辑JSON参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

let 接口返回器 = new 常用接口返回器(z.never(), z.object({}))

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
