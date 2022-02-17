import * as mf from '@frenchpastries/millefeuille'
import * as responses from '@frenchpastries/millefeuille/response'
import * as helpers from './helpers'
import { Route } from './route'
import { Handler, PathHandler, applyMiddleware } from './types'

type Context = { [key: string]: any }
type FindHandler = { context: Context; handler: any } | undefined
const findHandler = (
  paths: PathHandler[],
  request: mf.IncomingRequest
): FindHandler => {
  const pathname = request.location?.pathname ?? ''
  const method = request.method?.toLowerCase()
  const parts = pathname.split('/').filter(v => v !== '')
  for (const path of paths) {
    const p = path.path.split('/').filter(v => v !== '')
    const isSameMethod = path.method.toLowerCase() === method
    if (isSameMethod && p.length === parts.length) {
      const context = p.reduce<Context | null>((acc, val, idx) => {
        if (acc === null) return acc
        if (parts[idx] === val) return acc
        if (val.startsWith(':')) {
          const id = val.slice(1)
          const value = parts[idx]
          const num = parseInt(value)
          return { ...acc, [id]: isNaN(num) ? value : num }
        }
        return null
      }, {})
      if (context) return { context, handler: path.handler }
    }
  }
}

export class Router extends Function {
  #matchers: Route[]
  #paths: PathHandler[]

  private constructor(matchers: Route[]) {
    super()
    this.#matchers = matchers
    this.#paths = this.export()
    const paths = this.#paths
    return new Proxy(this, {
      apply(_target, _thisArg, argumentsList: [mf.IncomingRequest]) {
        const [request] = argumentsList
        const h = findHandler(paths, request)
        if (!h) return responses.internalError(`${request.pathname} not found`)
        request.context = h.context
        return h.handler(request)
      },
    })
  }

  export = (): PathHandler[] => {
    return this.#matchers.flatMap((matcher): PathHandler[] => {
      const { method, middlewares, route: path, handler } = matcher
      if (!handler.export) return [{ method, path, handler }]
      const exported = handler.export()
      if (exported.length === 0) return [{ method, path, handler }]
      return exported.flatMap((exprt): PathHandler[] => {
        const isAny = method === 'ANY'
        const isExprtAny = exprt.method === 'ANY'
        const isSameMethod = method === exprt.method
        if (!isAny && !isExprtAny && !isSameMethod) return []
        const finalPath = `${path}${exprt.path}`
        const path_ = helpers.request.route.removeTrailingSlash(finalPath)
        const handler = middlewares.reduce(applyMiddleware, exprt.handler)
        return [{ method: exprt.method, path: path_, handler }]
      })
    })
  }

  static routes<Input = any, Output = any>(
    allRoutes: Route[]
  ): Handler<Input, Output> {
    return new Router(allRoutes) as unknown as Handler<Input, Output>
  }
}

export const routes = Router.routes
