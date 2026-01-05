import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { readFile } from 'node:fs/promises'
import { 接口返回器 } from '../../interface/interface-returner'
import { 请求附加参数类型 } from '../../server/server'

/**
 * ### 静态文件返回器
 *
 * 用于返回静态文件的返回器
 * 支持自定义:
 * - MIME类型映射
 * - 缓存配置
 * - 自动文件读取（接收完整文件路径）
 */
export class 静态文件返回器 extends 接口返回器<string, { filePath: string }, any, any> {
  private MIME类型映射: Map<string, string>
  private 缓存控制: string | undefined

  public constructor(options: { MIME类型映射?: Record<string, string>; 缓存控制?: string }) {
    super()
    this.缓存控制 = options.缓存控制

    this.MIME类型映射 = new Map([
      ['.html', 'text/html; charset=utf-8'],
      ['.js', 'application/javascript'],
      ['.css', 'text/css'],
      ['.json', 'application/json'],
      ['.png', 'image/png'],
      ['.jpg', 'image/jpeg'],
      ['.jpeg', 'image/jpeg'],
      ['.gif', 'image/gif'],
      ['.svg', 'image/svg+xml'],
      ['.txt', 'text/plain'],
      ['.woff', 'font/woff'],
      ['.woff2', 'font/woff2'],
      ['.ttf', 'font/ttf'],
      ['.eot', 'application/vnd.ms-fontobject'],
      ['.md', 'text/markdown; charset=utf-8'],
      ['.xml', 'application/xml'],
      ...Object.entries(options.MIME类型映射 ?? {}),
    ])
  }

  public override async 实现(
    req: Request,
    res: Response,
    数据: Either<string, { filePath: string }>,
    请求附加参数: 请求附加参数类型,
  ): Promise<void> {
    let log = 请求附加参数.log

    if (数据.getTag() === 'Left') {
      // 处理错误情况
      let 错误消息 = 数据.assertLeft().getLeft()
      void log.error('文件获取失败: %s', 错误消息)
      res.status(404).send({ error: 错误消息 })
      return
    }

    // 处理成功情况 - 获得完整文件路径
    let 文件路径 = 数据.assertRight().getRight().filePath

    try {
      // 直接读取文件（传入的是完整路径）
      let 文件内容 = await readFile(文件路径, 'utf-8')

      // 获取文件扩展名
      let 扩展名 = 文件路径.substring(文件路径.lastIndexOf('.')).toLowerCase()
      let MIME类型 = this.MIME类型映射.get(扩展名) ?? 'application/octet-stream'

      // 设置响应头
      res.setHeader('Content-Type', MIME类型)

      let 缓存控制 = this.缓存控制
      if (缓存控制 !== void 0) {
        res.setHeader('Cache-Control', 缓存控制)
      }

      void log.debug('返回文件: %s, MIME类型: %s', 文件路径, MIME类型)
      res.send(文件内容)
    } catch (error) {
      void log.error('读取文件失败: %s, 错误: %o', 文件路径, error)
      res.status(500).send({ error: '读取文件失败' })
    }
  }
}
