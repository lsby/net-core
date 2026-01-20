import { API管理器 } from '../lib/api-manager'

class 文件上传组件 extends HTMLElement {
  private api管理器: API管理器 = new API管理器()
  private 文件输入: HTMLInputElement | null = null
  private 描述输入: HTMLInputElement | null = null
  private 上传按钮: HTMLButtonElement | null = null
  private 状态元素: HTMLElement | null = null
  private 日志元素: HTMLElement | null = null

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
    容器.style.maxWidth = '500px'
    容器.style.margin = '0 auto'

    // 创建标题
    let 标题 = document.createElement('h3')
    标题.textContent = '文件上传测试'
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

    // 创建描述输入
    let 描述标签 = document.createElement('label')
    描述标签.textContent = '描述 (可选):'
    描述标签.style.display = 'block'
    描述标签.style.marginBottom = '5px'
    容器.appendChild(描述标签)

    let 描述输入 = document.createElement('input')
    描述输入.type = 'text'
    描述输入.placeholder = '输入文件描述'
    描述输入.style.width = '100%'
    描述输入.style.padding = '8px'
    描述输入.style.marginBottom = '10px'
    描述输入.style.border = '1px solid #ccc'
    描述输入.style.borderRadius = '4px'
    容器.appendChild(描述输入)

    // 创建文件输入
    let 文件标签 = document.createElement('label')
    文件标签.textContent = '选择文件 (可选):'
    文件标签.style.display = 'block'
    文件标签.style.marginBottom = '5px'
    容器.appendChild(文件标签)

    let 文件输入 = document.createElement('input')
    文件输入.type = 'file'
    文件输入.multiple = true
    文件输入.style.width = '100%'
    文件输入.style.padding = '8px'
    文件输入.style.marginBottom = '10px'
    文件输入.style.border = '1px solid #ccc'
    文件输入.style.borderRadius = '4px'
    容器.appendChild(文件输入)

    // 创建上传按钮
    let 上传按钮 = document.createElement('button')
    上传按钮.textContent = '上传'
    上传按钮.style.padding = '10px 20px'
    上传按钮.style.background = '#007bff'
    上传按钮.style.color = 'white'
    上传按钮.style.border = 'none'
    上传按钮.style.borderRadius = '4px'
    上传按钮.style.cursor = 'pointer'
    容器.appendChild(上传按钮)

    // 创建日志元素
    let 日志元素 = document.createElement('pre')
    日志元素.id = 'log'
    日志元素.style.marginTop = '20px'
    日志元素.style.padding = '10px'
    日志元素.style.background = '#f8f9fa'
    日志元素.style.border = '1px solid #dee2e6'
    日志元素.style.borderRadius = '4px'
    日志元素.style.maxHeight = '200px'
    日志元素.style.overflowY = 'auto'
    日志元素.style.fontSize = '12px'
    日志元素.textContent = '日志:\n'
    容器.appendChild(日志元素)

    shadow.appendChild(容器)

    this.文件输入 = 文件输入
    this.描述输入 = 描述输入
    this.上传按钮 = 上传按钮
    this.状态元素 = 状态元素
    this.日志元素 = 日志元素
  }

  private 异步日志(消息: string): void {
    if (this.日志元素 !== null) {
      this.日志元素.textContent += new Date().toLocaleTimeString() + ': ' + 消息 + '\n'
      this.日志元素.scrollTop = this.日志元素.scrollHeight
    }
  }

  private 设置状态(消息: string, 成功: boolean): void {
    if (this.状态元素 !== null) {
      this.状态元素.textContent = '● ' + 消息
      this.状态元素.style.background = 成功 ? '#d4edda' : '#f8d7da'
      this.状态元素.style.color = 成功 ? '#155724' : '#721c24'
    }
  }

  private 异步设置状态(消息: string, 成功: boolean): void {
    this.设置状态(消息, 成功)
  }

  private 初始化监听(): void {
    if (this.上传按钮 !== null) {
      this.上传按钮.addEventListener('click', () => this.上传文件())
    }
  }

  private async 上传文件(): Promise<void> {
    if (this.文件输入 === null || this.文件输入.files === null) {
      this.异步日志('文件输入无效')
      this.异步设置状态('文件输入无效', false)
      return
    }

    this.异步设置状态('上传中...', false)
    this.异步日志('开始上传文件...')

    try {
      let formData = new FormData()
      formData.append('description', this.描述输入?.value ?? '')

      for (let file of this.文件输入.files) {
        formData.append('files', file)
      }

      let 结果 = await this.api管理器.form请求('/api/upload-file', formData)

      this.异步日志('上传成功: ' + JSON.stringify(结果, null, 2))
      this.异步设置状态('上传成功', true)
    } catch (错误) {
      this.异步日志('上传失败: ' + String(错误))
      this.异步设置状态('上传失败', false)
    }
  }
}

customElements.define('upload-file', 文件上传组件)
