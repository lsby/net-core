import { 接口逻辑测试, 默认请求附加参数 } from '@lsby/net-core'
import 接口 from './index'

export default new 接口逻辑测试(
  async () => {},
  async () => {
    // 对于组合接口, 可以通过"获得最后接口"或"获得上游接口"分别获得最后一个接口和除此之外的其他接口
    let 接口逻辑 = 接口.获得接口逻辑().获得最后接口()
    let 接口逻辑结果 = await 接口逻辑.实现({ body: { a: 10, b: 2 } }, {}, 默认请求附加参数)
    if (接口逻辑结果.isLeft()) throw new Error(`接口逻辑调用失败: ${接口逻辑结果.getLeft()}`)
    let 右值 = 接口逻辑结果.assertRight().getRight()
    console.log(`调用结果: ${右值}`)
    if (右值.result !== 5) throw new Error(`接口逻辑结果不正确: ${右值}`)
  },
)
