// 该文件由脚本自动生成, 请勿修改.
export type ArraySchema = {
  type: 'array'
  items?: JSONSchema | undefined
  $ref?: `http://${string}` | `https://${string}` | undefined
}
export type BooleanSchema = { type: 'boolean' }
export type NullSchema = { type: 'null' }
export type NumberSchema = { type: 'number' }
export type ObjectSchema =
  | {
      type: 'object'
      properties: Record<string, JSONSchema> | undefined
      required?: string[] | undefined
      definitions?: Record<string, JSONSchema> | undefined
    }
  | { type: 'object'; $ref?: `http://${string}` | `https://${string}` | undefined }
export type StringSchema = { type: 'string' }
export type JSONSchema = StringSchema | NumberSchema | BooleanSchema | NullSchema | ArraySchema | ObjectSchema
export type InterfaceType = [{ path: "/api/structure/add"; method: "post"; input: { json: { data: { type: "object"; properties: Record<string, JSONSchema>; required?: string[] | undefined; definitions?: Record<string, JSONSchema> | undefined; } | { type: "object"; $ref?: `http://${string}` | `https://${string}` | undefined; }; }; query: never; urlencoded: never; }; errorOutput: { status: "fail"; data: never; }; successOutput: { status: "success"; data: {}; }; wsOutput: {}; wsInput: {}; }]
