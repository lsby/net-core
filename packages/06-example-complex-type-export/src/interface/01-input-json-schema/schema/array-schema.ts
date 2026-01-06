import { NetCoreExportType } from '@lsby/net-core'
import { JSONSchema } from './schema-type'

export type ArraySchema = {
  type: 'array'
  items?: JSONSchema | undefined
  $ref?: `http://${string}` | `https://${string}` | undefined
}

type 导出 = NetCoreExportType<'ArraySchema', ArraySchema>
export default 导出
