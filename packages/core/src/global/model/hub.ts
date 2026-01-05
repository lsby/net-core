export type 集线器监听器<T> = (数据: T) => Promise<void>
export type 广播错误处理<T> = (数据: T, 索引: number, 错误: unknown) => Promise<void> | void

// 监听器持有者，用于在外部持有生命周期
export class 集线器监听器持有者<T> {
  public constructor(public readonly 监听器: 集线器监听器<T>) {}
}

export class 集线器模型<T> {
  // 使用 WeakRef + FinalizationRegistry 防止"反向持有" this
  private static 清理注册器 = new FinalizationRegistry<{
    实例引用: WeakRef<集线器模型<any>>
    监听器: 集线器监听器<any>
  }>(({ 实例引用, 监听器 }) => {
    let 实例 = 实例引用.deref()
    if (实例 === void 0) return

    let 索引 = 实例.监听器列表.indexOf(监听器)
    if (索引 !== -1) 实例.监听器列表.splice(索引, 1)
  })

  private 监听器列表: 集线器监听器<T>[] = []
  private 持有者映射: WeakMap<集线器监听器持有者<T>, 集线器监听器<T>> = new WeakMap()
  private 错误处理器: 广播错误处理<T> | null = null

  /**
   * 设置广播错误时的处理器。
   */
  public 设置错误处理器(处理器: 广播错误处理<T>): void {
    this.错误处理器 = 处理器
  }

  /**
   * 注册监听器。
   * 若外部不再持有返回的 `监听器持有者`，监听器会在未来某个时间自动移除。
   * ⚠️ 自动清理是非确定性的，不能依赖它实现实时释放。
   */
  public 添加监听器(监听器: 集线器监听器<T>): 集线器监听器持有者<T> {
    this.监听器列表.push(监听器)

    let 持有者 = new 集线器监听器持有者(监听器)
    this.持有者映射.set(持有者, 监听器)

    // 创建弱引用避免闭包保活 this
    let 实例弱引用 = new WeakRef(this)
    集线器模型.清理注册器.register(持有者, { 实例引用: 实例弱引用, 监听器 }, 持有者)

    return 持有者
  }

  public 移除监听器(持有者: 集线器监听器持有者<T>): void {
    let 监听器 = this.持有者映射.get(持有者)
    if (监听器 === void 0) return

    let 索引 = this.监听器列表.indexOf(监听器)
    if (索引 !== -1) this.监听器列表.splice(索引, 1)
    集线器模型.清理注册器.unregister(持有者)
    this.持有者映射.delete(持有者)
  }

  public async 广播(数据: T): Promise<void> {
    let snapshot = [...this.监听器列表]
    let 结果 = await Promise.allSettled(snapshot.map((l) => l(数据)))

    // 如果有监听器执行失败，交给错误处理器处理
    for (let [索引, 结果项] of 结果.entries()) {
      if (结果项.status === 'rejected' && this.错误处理器 !== null) {
        await Promise.resolve(this.错误处理器(数据, 索引, 结果项.reason))
      }
    }
  }
}
