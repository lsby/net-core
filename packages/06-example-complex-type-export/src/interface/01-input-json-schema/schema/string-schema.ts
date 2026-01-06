import { NetCoreExportType } from '@lsby/net-core'

export type StringSchema = { type: 'string' }

type 导出 = NetCoreExportType<'StringSchema', StringSchema>
export default 导出
