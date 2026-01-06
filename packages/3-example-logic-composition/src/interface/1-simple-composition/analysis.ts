import { 默认请求附加参数 } from '@lsby/net-core'
import 接口 from './index'

// 对于组合接口, 如果想获得组成其的单个接口逻辑
// 可以通过"获得最后接口"或"获得上游接口"分别获得最后一个接口和除此之外的其他接口
// 例如, 如果想拿到倒数第二个组合接口逻辑, 可以使用"接口.获得接口逻辑().获得上游接口().获得最后接口()"

let 组合逻辑 = 接口.获得接口逻辑()
let 乘以二 = 组合逻辑.获得最后接口()
let 参数解析逻辑和加五逻辑 = 组合逻辑.获得上游接口()
let 加五 = 参数解析逻辑和加五逻辑.获得最后接口()

let data1 = await 乘以二.实现({}, { value: 3 }, 默认请求附加参数)
let data2 = await 加五.实现({}, { value: 10 }, 默认请求附加参数)
let data3 = await 加五.绑定(乘以二).实现({}, { value: 1 }, 默认请求附加参数)

console.log(data1) // Right 6
console.log(data2) // Right 15
console.log(data3) // Right 12
