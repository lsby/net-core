let dummyMiddleware =
  () =>
  (req: any, res: any, next: any): any =>
    next()

let mockExpress: any = () => {
  return {
    use: dummyMiddleware,
    listen: () => ({ on: (): void => {}, once: (): void => {}, off: (): void => {}, address: (): null => null }),
  }
}

mockExpress.json = dummyMiddleware
mockExpress.urlencoded = dummyMiddleware

export default mockExpress
