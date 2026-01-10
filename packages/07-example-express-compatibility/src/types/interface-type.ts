// 该文件由脚本自动生成, 请勿修改.
export type InterfaceType = [
  {
    path: '/api/calculate-add'
    method: 'post'
    input: { a: number; b: number }
    errorOutput: { status: 'fail'; data: never }
    successOutput: { status: 'success'; data: { result: number } }
    wsOutput: {}
    wsInput: {}
  },
  {
    path: '/api/raw-express'
    method: 'post'
    input: {}
    errorOutput: any
    successOutput: any
    wsOutput: {}
    wsInput: {}
  },
]
