import { NetCoreExportType } from '@lsby/net-core'

export type NullSchema = { type: 'null' }

type 导出 = NetCoreExportType<'NullSchema', NullSchema>
export default 导出
