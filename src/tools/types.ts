export type 去除只读<T> = {
  -readonly [P in keyof T]: T[P]
}
