export type 集线器监听器<T> = (数据: T) => Promise<void>
export type 广播错误处理<T> = (数据: T, 索引: number, 错误: unknown) => Promise<void> | void

export class 集线器监听器宿主 {
  private 解除回调: (() => void) | null = null

  /** @internal */
  public 绑定回调(回调: () => void): void {
    if (this.解除回调 !== null) {
      throw new Error('此宿主已被绑定到一个监听器，不可重复绑定')
    }
    this.解除回调 = 回调
  }

  public 解绑(): void {
    if (this.解除回调 !== null) {
      this.解除回调()
      this.解除回调 = null
    }
  }
}

export class 集线器模型<T> {
  // 使用 WeakRef + FinalizationRegistry 防止"反向持有" this
  private static 清理注册器 = new FinalizationRegistry<{
    实例引用: WeakRef<集线器模型<any>>
    监听器: 集线器监听器<any>
  }>(({ 实例引用, 监听器 }) => {
    let 实例 = 实例引用.deref()
    if (实例 === void 0) return

    实例.监听器集合.delete(监听器)
  })

  private 监听器集合: Set<集线器监听器<T>> = new Set()
  private 错误处理器: 广播错误处理<T> | null = null

  /**
   * 设置广播错误时的处理器。
   */
  public 设置错误处理器(处理器: 广播错误处理<T>): void {
    this.错误处理器 = 处理器
  }

  /**
   * 注册监听器。
   * 必须提供一个 `集线器监听器宿主` 实例。若宿主对象不被持有并被回收，监听器会在未来自动回收。
   */
  public 添加监听器(监听器: 集线器监听器<T>, 宿主: 集线器监听器宿主): void {
    // 创建弱引用避免闭包保活 this
    let 实例弱引用 = new WeakRef(this)

    宿主.绑定回调(() => {
      let 实例 = 实例弱引用.deref()
      if (实例 !== void 0) {
        实例.监听器集合.delete(监听器)
      }
      集线器模型.清理注册器.unregister(宿主)
    })

    this.监听器集合.add(监听器)
    集线器模型.清理注册器.register(宿主, { 实例引用: 实例弱引用, 监听器 }, 宿主)
  }

  public async 广播(数据: T): Promise<void> {
    let snapshot = [...this.监听器集合]
    let 结果 = await Promise.allSettled(snapshot.map((l) => l(数据)))

    // 如果有监听器执行失败，交给错误处理器处理
    for (let [索引, 结果项] of 结果.entries()) {
      if (结果项.status === 'rejected' && this.错误处理器 !== null) {
        await Promise.resolve(this.错误处理器(数据, 索引, 结果项.reason))
      }
    }
  }
}
