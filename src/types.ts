import * as mf from '@frenchpastries/millefeuille'

export type PathHandler<Input = any, Output = any> = {
  method: string
  path: string
  handler: Handler<Input, Output>
}

// prettier-ignore
export type Handler<Input, Output> =
  mf.Handler<mf.IncomingRequest<Input>, Output> &
    { export?: () => PathHandler<Input, Output>[] }

// prettier-ignore
export type Middleware<Output = any> =
  (handler: mf.Handler<mf.IncomingRequest, Output>) =>
    mf.Handler<mf.IncomingRequest, Output>

export const applyMiddleware = <Input = any, Output = any>(
  acc: Handler<Input, Output>,
  m: Middleware<Output>
): Handler<Input, Output> => {
  // @ts-ignore
  const fun: Handler<Input, Output> = m(acc)
  fun.export = acc.export
  return fun
}
