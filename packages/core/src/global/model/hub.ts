export type 集线器监听器<T> = (数据: T) => Promise<void>
export type 广播错误处理<T> = (数据: T, 索引: number, 错误: unknown) => Promise<void> | void
/**
 * 集线器监听器的生命周期宿主。
 *
 * ⚠️ 极其关键的生命周期警告 (基于可达性分析的 GC 陷阱)：
 * 就算该宿主对象是在某个函数/代码块内部用 `let` 定义的，
 * 只要在传入并绑定后，后续的块级执行代码逻辑中再也没有明确使用过这个变量（哪怕依然在同一个作用域中，只隔了几个 `await` 导致挂起），
 * V8 的可达性分析 (Reachability Analysis) 机制就有可能直接将它判定为"死亡实例"，并毫无预兆地将其提早垃圾回收。
 * 一旦它被回收，底层基于 FinalizationRegistry 机制的监听器必定会被默默注销销毁，进而引发不可捉摸的幽灵 Bug。
 *
 * 因此强烈建议对宿主的处理必须做到以下做法之一以防止"同作用域幽灵断联"：
 * 1. 最稳妥的做法：在你期待的监听生命周期末尾，务必显式并手动调用一次 `宿主.解绑()` 操作 (它同时也是维持该变量存活的必要证明)。
 * 2. 绑定在长期实体生存期：把它强行关联进拥有对应生存期的实体内 (例如直接作为一个持久化句柄的强引用缓存属性对象存在)。
 */
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
   *
   * ⚠️ 危险警告: 即使在该方法的同一逻辑层面的词法作用域内，若未显式调用 `宿主.解绑` 或保留长期强引用使用痕迹，
   * 那么随着控制权转交和可达性缩减，仍然存在被 V8 提前进行垃圾回收而突然导致监听失效的极大风险。
   * 建议详细阅读 `集线器监听器宿主` 类的文档备注以此警醒。
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
