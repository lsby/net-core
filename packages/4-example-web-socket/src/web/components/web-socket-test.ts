import { API管理器 } from '../lib/api-manager'

class ws测试组件 extends HTMLElement {
  private api管理器: API管理器 = new API管理器()
  private 发送按钮: HTMLButtonElement | null = null
  private 发送数据按钮: HTMLButtonElement | null = null
  private 状态元素: HTMLElement | null = null
  private 参数A输入: HTMLInputElement | null = null
  private 参数B输入: HTMLInputElement | null = null
  private 日志元素: HTMLElement | null = null
  private 发送数据函数: ((参数: { data: string }) => void) | null = null

  public constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  public connectedCallback(): void {
    this.渲染()
    this.初始化监听()
  }

  private 渲染(): void {
    let shadow = this.shadowRoot
    if (shadow === null) return

    // 创建容器
    let 容器 = document.createElement('div')
    容器.style.padding = '20px'
    容器.style.border = '1px solid #ddd'
    容器.style.borderRadius = '8px'

    // 创建标题
    let 标题 = document.createElement('h3')
    标题.textContent = 'WebSocket 测试'
    标题.style.marginTop = '0'
    容器.appendChild(标题)

    // 创建状态元素
    let 状态元素 = document.createElement('div')
    状态元素.id = 'status'
    状态元素.textContent = '● 就绪'
    状态元素.style.margin = '10px 0'
    状态元素.style.padding = '8px'
    状态元素.style.borderRadius = '4px'
    状态元素.style.background = '#d4edda'
    状态元素.style.color = '#155724'
    容器.appendChild(状态元素)

    // 创建输入和按钮容器
    let 输入容器 = document.createElement('div')

    // 参数A输入
    let 参数A标签 = document.createElement('label')
    参数A标签.textContent = '参数A: '
    let 参数A输入 = document.createElement('input')
    参数A输入.type = 'number'
    参数A输入.id = 'paramA'
    参数A输入.value = '10'
    参数A输入.style.width = '100%'
    参数A输入.style.padding = '8px'
    参数A输入.style.margin = '5px 0 10px 0'
    参数A输入.style.boxSizing = 'border-box'
    参数A标签.appendChild(参数A输入)
    输入容器.appendChild(参数A标签)

    // 参数B输入
    let 参数B标签 = document.createElement('label')
    参数B标签.textContent = '参数B: '
    let 参数B输入 = document.createElement('input')
    参数B输入.type = 'number'
    参数B输入.id = 'paramB'
    参数B输入.value = '20'
    参数B输入.style.width = '100%'
    参数B输入.style.padding = '8px'
    参数B输入.style.margin = '5px 0 10px 0'
    参数B输入.style.boxSizing = 'border-box'
    参数B标签.appendChild(参数B输入)
    输入容器.appendChild(参数B标签)

    // 发送请求按钮
    let 发送按钮 = document.createElement('button')
    发送按钮.id = 'sendBtn'
    发送按钮.textContent = '发送请求'
    发送按钮.style.padding = '8px 16px'
    发送按钮.style.margin = '5px 5px 5px 0'
    发送按钮.style.cursor = 'pointer'
    输入容器.appendChild(发送按钮)

    // 发送数据按钮
    let 发送数据按钮 = document.createElement('button')
    发送数据按钮.id = 'sendDataBtn'
    发送数据按钮.textContent = '发送数据'
    发送数据按钮.style.padding = '8px 16px'
    发送数据按钮.style.margin = '5px 5px 5px 0'
    发送数据按钮.style.cursor = 'pointer'
    输入容器.appendChild(发送数据按钮)

    容器.appendChild(输入容器)

    // 日志标题
    let 日志标题 = document.createElement('h4')
    日志标题.textContent = '日志'
    容器.appendChild(日志标题)

    // 日志元素
    let 日志元素 = document.createElement('div')
    日志元素.id = 'log'
    日志元素.style.background = '#373333ff'
    日志元素.style.padding = '10px'
    日志元素.style.height = '150px'
    日志元素.style.overflowY = 'auto'
    日志元素.style.fontSize = '12px'
    容器.appendChild(日志元素)

    shadow.appendChild(容器)

    this.发送按钮 = 发送按钮
    this.发送数据按钮 = 发送数据按钮
    this.状态元素 = 状态元素
    this.参数A输入 = 参数A输入
    this.参数B输入 = 参数B输入
    this.日志元素 = 日志元素
  }

  private 初始化监听(): void {
    if (this.发送按钮 !== null)
      this.发送按钮.onclick = (): void => {
        this.发送请求().catch((_错误): void => {})
      }
    if (this.发送数据按钮 !== null)
      this.发送数据按钮.onclick = (): void => {
        this.发送数据()
      }
  }

  private async 发送请求(): Promise<void> {
    let 参数A数值 = this.参数A输入 !== null ? parseInt(this.参数A输入.value) : 0
    let 参数B数值 = this.参数B输入 !== null ? parseInt(this.参数B输入.value) : 0

    try {
      this.设置状态('发送中', 'waiting')
      this.记录(`发送: a=${参数A数值}, b=${参数B数值}`)
      let 响应 = await this.api管理器.post请求(
        '/api/web-socket-demo',
        { a: 参数A数值, b: 参数B数值 },
        {
          连接回调: async (发送数据): Promise<void> => {
            this.记录('WebSocket已连接')
            this.发送数据函数 = 发送数据
          },
          信息回调: async (数据): Promise<void> => {
            this.记录(`WebSocket收到: ${JSON.stringify(数据)}`)
          },
          关闭回调: async (): Promise<void> => {
            this.记录('WebSocket已关闭')
            this.发送数据函数 = null
          },
          错误回调: async (): Promise<void> => {
            this.记录('WebSocket错误')
            this.发送数据函数 = null
          },
        },
      )
      this.设置状态('成功', 'success')
      this.记录(`响应: ${JSON.stringify(响应)}`)
    } catch (错误) {
      this.设置状态('错误', 'error')
      this.记录(`错误: ${错误 instanceof Error ? 错误.message : String(错误)}`)
    }
  }

  private 发送数据(): void {
    if (this.发送数据函数 !== null) {
      let 数据 = { data: '数据' }
      this.发送数据函数(数据)
      this.记录(`发送数据: ${JSON.stringify(数据)}`)
    } else {
      this.记录('WebSocket未连接，无法发送数据')
    }
  }

  private 设置状态(文本: string, 类型: 'success' | 'waiting' | 'error'): void {
    if (this.状态元素 !== null) {
      this.状态元素.textContent = `● ${文本}`
      let 背景色: string
      let 文字色: string
      switch (类型) {
        case 'success':
          背景色 = '#d4edda'
          文字色 = '#155724'
          break
        case 'waiting':
          背景色 = '#fff3cd'
          文字色 = '#856404'
          break
        case 'error':
          背景色 = '#f8d7da'
          文字色 = '#721c24'
          break
      }
      this.状态元素.style.background = 背景色
      this.状态元素.style.color = 文字色
    }
  }

  private 记录(消息: string): void {
    if (this.日志元素 !== null) {
      let 时间 = new Date().toLocaleTimeString()
      let 项目 = document.createElement('div')
      项目.textContent = `[${时间}] ${消息}`
      项目.style.padding = '2px 0'
      项目.style.borderBottom = '1px solid #eee'
      this.日志元素.appendChild(项目)
      this.日志元素.scrollTop = this.日志元素.scrollHeight
    }
  }
}

customElements.define('web-socket-test', ws测试组件)
export default ws测试组件
