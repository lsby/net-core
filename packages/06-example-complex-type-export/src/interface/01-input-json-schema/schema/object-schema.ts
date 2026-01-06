import { NetCoreExportType } from '@lsby/net-core'
import { JSONSchema } from './schema-type'

export type ObjectSchema =
  | {
      type: 'object'
      properties: Record<string, JSONSchema> | undefined
      required?: string[] | undefined
      definitions?: Record<string, JSONSchema> | undefined
    }
  | { type: 'object'; $ref?: `http://${string}` | `https://${string}` | undefined }

type 导出 = NetCoreExportType<'ObjectSchema', ObjectSchema>
export default 导出
