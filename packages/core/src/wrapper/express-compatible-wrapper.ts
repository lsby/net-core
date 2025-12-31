import { Right } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { 接口, 接口方法类型, 接口路径类型 } from '../interface/interface-base'
import { 接口逻辑Base, 空对象 } from '../interface/interface-logic'
import { 接口结果转换器 } from '../interface/interface-result'
import { 接口结果返回器 } from '../interface/interface-retuen'

/**
 * Express 兼容接口封装
 *
 * 为熟悉 Express 的用户提供快速迁移方案
 *
 * 特点:
 * - 接收 Express 风格的处理函数 (req, res) => Promise<void>
 * - 输入输出类型均为 any，不支持类型推断
 * - 不支持插件系统和复用
 * - 最大化简化，最小化学习曲线
 *
 * 示例:
 * ```ts
 * const api = new Express兼容接口封装(
 *   '/api/user',
 *   'post',
 *   async (req, res) => {
 *     const data = req.body
 *     res.send({ success: true, data })
 *   }
 * )
 * ```
 */
export class Express兼容接口封装 extends 接口<
  接口路径类型,
  接口方法类型,
  接口逻辑Base<[], 空对象, string, {}, null, null>,
  z.ZodType<any>,
  z.ZodType<any>,
  Express兼容结果转换器,
  Express兼容返回器
> {
  public constructor(
    请求路径: 接口路径类型,
    请求方法: 接口方法类型,
    处理函数: (req: Request, res: Response) => Promise<void>,
  ) {
    // 创建一个空逻辑（因为处理函数在返回器中执行）
    let 逻辑 = 接口逻辑Base.构造([], async () => {
      // 返回空对象，实际逻辑在返回器中执行
      return new Right({})
    })

    let 转换器 = new Express兼容结果转换器()
    let 返回器 = new Express兼容返回器(处理函数)

    super(
      请求路径,
      请求方法,
      逻辑,
      z.any(), // 错误形式不做限制
      z.any(), // 正确形式不做限制
      转换器,
      返回器,
    )
  }
}

/**
 * Express 兼容结果转换器
 *
 * 直接通过，不做任何转换
 */
class Express兼容结果转换器 extends 接口结果转换器<string, {}, any, any> {
  public override 实现(数据: any): any {
    return 数据
  }
}

/**
 * Express 兼容返回器
 *
 * 直接执行用户提供的处理函数
 */
class Express兼容返回器 extends 接口结果返回器<any> {
  public constructor(private 处理函数: (req: Request, res: Response) => Promise<void>) {
    super()
  }

  public override 返回(req: Request, res: Response, _结果: any): Promise<void> {
    return this.处理函数(req, res)
  }
}
