import { 接口逻辑测试, 默认请求附加参数 } from '@lsby/net-core'
import 接口 from './index'

// 对于接口逻辑, 使用"接口逻辑测试"来测试
// 需要提供的参数:
// - 前置过程: 用于测试前的操作, 通常可以做对测试库的初始化等操作
// - 后置过程: 用于实际测试
export default new 接口逻辑测试(
  async () => {},
  async () => {
    // 可以用"获得接口逻辑"获得接口的接口逻辑
    // 这基本等价于一个函数, 通过".调用"来调用
    // 调用时需要提供本来由插件提供的参数, 以及逻辑附加参数和请求附加参数
    // 请求附加参数可以使用框架提供的"默认请求附加参数", 也可以自行拼装
    let 接口逻辑 = 接口.获得接口逻辑()
    let 接口逻辑结果 = await 接口逻辑.调用({ body: { a: 1, b: 2 } }, {}, 默认请求附加参数)
    if (接口逻辑结果.isLeft()) throw new Error(`接口逻辑调用失败: ${接口逻辑结果.getLeft()}`)
    let 右值 = 接口逻辑结果.assertRight().getRight()
    console.log(`调用结果: ${JSON.stringify(右值)}`)
    if (右值.result !== 3) throw new Error(`接口逻辑结果不正确: ${右值}`)
  },
)
