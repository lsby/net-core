export const calcCode = `
import type { z } from 'zod'
import type { 合并JSON插件结果, 接口类型抽象类 } from '@lsby/net-core'
import exportedApiSchema from './type'

type Api =
  typeof exportedApiSchema extends 接口类型抽象类<
    infer Path,
    infer Method,
    infer PreApis,
    infer SuccessSchema,
    infer ErrorSchema
  >
    ? {
        path: Path
        method: Method
        input: 合并JSON插件结果<PreApis>
        successOutput: z.infer<SuccessSchema>
        errorOutput: z.infer<ErrorSchema>
      }
    : never

export default Api
`
