import { EXPORT_TYPE } from '../symbol/export-type'

export type NetCoreExportType<Name, T> = {
  name: Name
  symbol: typeof EXPORT_TYPE
  type: T
}
export type GetNetCoreExportTypeName<T> = T extends NetCoreExportType<infer X, any> ? X : never
export type GetNetCoreExportTypeDefine<T> = T extends NetCoreExportType<any, infer X> ? X : never
