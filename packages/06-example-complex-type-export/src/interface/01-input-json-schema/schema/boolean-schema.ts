import { NetCoreExportType } from '@lsby/net-core'

export type BooleanSchema = { type: 'boolean' }

type 导出 = NetCoreExportType<'BooleanSchema', BooleanSchema>
export default 导出
