import { InterfaceType } from '../../types/interface-type'

type 找接口<P extends string, T extends readonly any[] = InterfaceType> = T extends readonly [infer F, ...infer Rest]
  ? F extends { path: P }
    ? F
    : 找接口<P, Rest>
  : never
type 取FORM输入<I> = I extends { input: { form: infer 输入 } } ? 输入 : never
type 取http错误输出<I> = I extends { errorOutput: infer 输出 } ? 输出 : never
type 取http正确输出<I> = I extends { successOutput: infer 输出 } ? 输出 : never
type 所有FORM路径 = InterfaceType extends readonly (infer Item)[]
  ? Item extends { method: 'post'; path: infer P }
    ? P
    : never
  : never

export class API管理器 {
  public async form请求<P extends 所有FORM路径>(
    路径: P,
    formData: 取FORM输入<找接口<P>>,
  ): Promise<取http错误输出<找接口<P>> | 取http正确输出<找接口<P>>> {
    try {
      let 响应 = await fetch(路径, { method: 'POST', body: formData })
      return await 响应.json()
    } catch (错误) {
      throw new Error(`上传失败: ${错误 instanceof Error ? 错误.message : String(错误)}`)
    }
  }
}
