export function parseURL(url: string): { protocol: string; host: string; pathname: string } | null {
  // 处理没有协议的情况，假设使用当前页面的域名
  if (url.includes('://') === false) {
    url = `${window.location.protocol}//${window.location.host}${url.startsWith('/') ? '' : '/'}${url}`
  }

  let urlRegex = /^(https?:)\/\/(.*?)(\/.*|$)/
  let match = url.match(urlRegex)

  if (match === null) return null

  let protocol = match[1]
  let host = match[2]
  if (protocol === void 0 || host === void 0) {
    throw new Error('解析失败')
  }

  return { protocol: protocol, host: host, pathname: match[3] ?? '/' }
}
