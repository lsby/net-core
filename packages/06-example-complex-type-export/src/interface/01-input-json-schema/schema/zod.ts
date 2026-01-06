import { z } from 'zod'
import { JSONSchema } from './schema-type'

export let http路径 = z.custom<`http://${string}` | `https://${string}`>(
  (val) => {
    if (typeof val !== 'string') return false
    try {
      let url = new URL(val)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  },
  { message: 'http路径校验失败' },
)

export let StringSchemaZod = z.object({ type: z.literal('string') })

export let NumberSchemaZod = z.object({ type: z.literal('number') })

export let BooleanSchemaZod = z.object({ type: z.literal('boolean') })

export let NullSchemaZod = z.object({ type: z.literal('null') })

export let JSONSchemaZod: z.ZodType<JSONSchema> = z.lazy(() =>
  z.union([StringSchemaZod, NumberSchemaZod, BooleanSchemaZod, NullSchemaZod, ArraySchemaZod, ObjectSchemaZod]),
)

export let ArraySchemaZod = z.object({
  type: z.literal('array'),
  items: JSONSchemaZod.optional(),
  $ref: http路径.optional(),
})

export let ObjectSchemaRefZod = z.object({ type: z.literal('object'), $ref: http路径.optional() })
export let ObjectSchemaPropZod = z.object({
  type: z.literal('object'),
  properties: z.record(JSONSchemaZod),
  required: z.string().array().optional(),
  definitions: z.record(JSONSchemaZod).optional(),
})
export let ObjectSchemaZod = z.union([ObjectSchemaPropZod, ObjectSchemaRefZod])
