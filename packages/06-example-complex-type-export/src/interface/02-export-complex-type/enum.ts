import { NetCoreExportType } from '@lsby/net-core'

export enum TestEnum {
  A,
  B,
}

type 导出 = NetCoreExportType<'TestEnum', TestEnum>
export default 导出
