import * as mf from '@frenchpastries/millefeuille'
import { Method } from './helpers/request/types'
import * as helpers from './helpers'
import { Router } from './router'
import * as router from './router'
import { Handler, Middleware } from './types'

// prettier-ignore
export class Route {
  method: Method
  route: string
  handler: Handler | Router
  middlewares: Middleware[]

  private constructor(
    method: Method,
    route: string,
    handler: Handler | Router,
    middlewares: Middleware[] = []
  ) {
    const route_ = route.startsWith('/') ? route : `/${route}`
    const route__ = helpers.request.route.removeTrailingSlash(route_)
    this.method = method
    this.route = route__
    this.handler = handler
    this.middlewares = middlewares
  }

  static route(method: Method) {
    return function (route: string, handler: Handler) {
      return new Route(method, route, handler)
    }
  }

  static context(route: string, ...args: [...midlwre: Middleware[], router: Router]): Route
  static context(route: string, ...args: [...midlwre: Middleware[], routes: Route[]]): Route
  static context(route: string, ...args: [...Middleware[], Route[] | Router]): Route {
    const endIdx = args.length - 1
    const rts = args[endIdx] as Route[]
    const middlewares = args.slice(0, endIdx) as Middleware[]
    const handler = rts instanceof Router ? rts : router.routes(rts)
    return new Route('ANY', route, handler, middlewares)
  }

  static notFound(handler: mf.Handler<mf.IncomingRequest, any>) {
    return Route.route('NOT_FOUND')('/', handler)
  }
}

export const get = Route.route('GET')
export const post = Route.route('POST')
export const patch = Route.route('PATCH')
export const put = Route.route('PUT')
export const del = Route.route('DELETE')
export const options = Route.route('OPTIONS')
export const any = Route.route('GET')
export const context = Route.context
export const notFound = Route.notFound
