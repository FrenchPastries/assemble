import * as mf from '@frenchpastries/millefeuille'
import * as response from '@frenchpastries/millefeuille/response'
import * as asble from '../../src/assemble'

export let counter1 = 0
export let counter2 = 0

export const handler = (path: string) => {
  return async (request: mf.IncomingRequest) => {
    const ctx = request.context ?? {}
    const result = JSON.stringify({ url: request.url, path, ctx })
    const res = response.response(result)
    const headers = { ...res.headers, 'Content-Type': 'application/json' }
    const res_ = { ...res, headers }
    return res_
  }
}

export const middleware1: asble.Middleware<any> = handler => {
  return async request => {
    counter1 += 1
    return handler(request)
  }
}
export const middleware2: asble.Middleware<any> = handler => {
  return async request => {
    counter2 += 1
    if (counter2 >= 8) return { statusCode: 500, body: 'middleware2' }
    return handler(request)
  }
}

export const reset = () => {
  counter1 = 0
  counter2 = 0
}
