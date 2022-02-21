import * as mf from '@frenchpastries/millefeuille'

// prettier-ignore
export type Handler<Input = any, Output = any> =
  mf.Handler<mf.IncomingRequest<Input>, Output>

// prettier-ignore
export type Middleware<Output = any> =
  (handler: mf.Handler<mf.IncomingRequest, Output>) =>
    mf.Handler<mf.IncomingRequest, Output>
