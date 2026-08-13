import type { Request, Response } from 'express'
import type { 任意接口 } from '../interface/interface-base'
import type { 任意接口逻辑 } from '../interface/interface-logic'
import type { 任意接口返回器 } from '../interface/interface-returner'
import type { 请求附加参数类型 } from '../types/types'

/**
 * 执行已经完成路由匹配的接口。
 *
 * 路由匹配、请求级异常处理和最终请求日志由调用方负责；此函数统一插件、接口逻辑与返回器的执行语义。
 */
export async function 执行已匹配接口(opt: {
  req: Request
  res: Response
  目标接口: 任意接口
  请求附加参数: 请求附加参数类型
}): Promise<void> {
  let { req, res, 目标接口, 请求附加参数 } = opt
  let log = 请求附加参数.log

  let 接口逻辑 = 目标接口.获得接口逻辑() as 任意接口逻辑
  let 接口返回器 = 目标接口.获得接口返回器() as 任意接口返回器

  let 总开始 = Date.now()

  // ---------- 接口逻辑 ----------
  let 开始 = Date.now()
  await log.trace('调用接口逻辑...')

  let 插件们 = 接口逻辑.获得插件们()

  await log.trace('找到 %o 个 插件, 准备执行...', 插件们.length)
  let 插件结果E = await 接口逻辑.计算插件结果(req, res, 请求附加参数)
  if (插件结果E.isLeft()) {
    let error = 插件结果E.assertLeft().getLeft()
    await log.warn('插件执行拒绝: %d %o', error.code, error.data)
    res.status(error.code).send(error.data)
    return
  }
  let 插件结果 = 插件结果E.assertRight().getRight()
  await log.trace('插件 执行完毕')

  await log.trace('准备执行接口实现...')
  let 接口结果 = await 接口逻辑.调用(插件结果, {}, 请求附加参数)
  await log.trace('接口实现执行完毕')

  let 接口耗时 = Date.now() - 开始
  if (接口耗时 > 500) {
    await log.warn('接口逻辑执行完毕 (慢执行), 耗时: %o ms', 接口耗时)
  } else {
    await log.trace('接口逻辑执行完毕, 耗时: %o ms', 接口耗时)
  }

  // ---------- 接口返回器 ----------
  开始 = Date.now()
  await 接口返回器.实现(req, res, 接口结果, 请求附加参数)
  let 返回耗时 = Date.now() - 开始
  await log.trace('返回逻辑执行完毕, 耗时: %o ms', 返回耗时)

  // ---------- 总耗时 ----------
  let 总耗时 = Date.now() - 总开始
  await log.trace('接口完整流转耗时: %o ms', 总耗时)
}
