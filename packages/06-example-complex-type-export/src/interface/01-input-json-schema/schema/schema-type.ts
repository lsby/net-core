import { NetCoreExportType } from '@lsby/net-core'
import { ArraySchema } from './array-schema'
import { BooleanSchema } from './boolean-schema'
import { NullSchema } from './null-schema'
import { NumberSchema } from './number-schema'
import { ObjectSchema } from './object-schema'
import { StringSchema } from './string-schema'

export type JSONSchema = StringSchema | NumberSchema | BooleanSchema | NullSchema | ArraySchema | ObjectSchema

type 导出 = NetCoreExportType<'JSONSchema', JSONSchema>
export default 导出
