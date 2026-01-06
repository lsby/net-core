import { NetCoreExportType } from '@lsby/net-core'

export type NumberSchema = { type: 'number' }

type 导出 = NetCoreExportType<'NumberSchema', NumberSchema>
export default 导出
