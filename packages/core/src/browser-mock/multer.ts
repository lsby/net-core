let dummyMiddleware =
  () =>
  (req: any, res: any, next: any): any =>
    next()

export default (): { any: () => (req: any, res: any, next: any) => any } => ({ any: dummyMiddleware })
