export const calcCode = `
import type { 接口类型, JSON解析插件 } from "@lsby/net-core"
import type { z } from "zod"

import exportedApiSchema from "./type"

type GetApiInputFromPreApi<PreApis> = PreApis extends []
  ? {}
  : PreApis extends [infer x, ...infer xs]
    ? x extends JSON解析插件<infer input>
      ? z.infer<input>
      : GetApiInputFromPreApi<xs>
    : {}

type Api = (typeof exportedApiSchema) extends 接口类型<infer Path, infer Method, infer PreApis, infer SuccessSchema, infer ErrorSchema>
  ? {
      path: Path,
      method: Method,
      input: GetApiInputFromPreApi<PreApis>,
      successOutput: z.infer<SuccessSchema>,
      errorOutput: z.infer<ErrorSchema>,
    }
  : never

export default Api
`
