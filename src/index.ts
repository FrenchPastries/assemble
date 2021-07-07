import {
  ServerResponse,
  Handler,
  IncomingRequest,
} from '@frenchpastries/millefeuille'
import * as response from '@frenchpastries/millefeuille/response'
import { types } from './request'
import * as helpers from './helpers'
import { toJSON } from './jsonify'
import { exportRoutes } from './export-routes'

const getRouteSegments = (route: string) => route.split('/').slice(1)

const addHandler = (
  segments: any,
  urlSegments: string[],
  handler: Handler<IncomingRequest, any>
) => {
  if (urlSegments.length === 0) {
    return handler
  } else {
    const part = urlSegments[0]
    if (part.startsWith(':')) {
      const glob = segments.global || {}
      segments.global = {
        ...glob,
        name: part.slice(1),
        parts: addHandler(glob.parts || {}, urlSegments.slice(1), handler),
      }
    } else {
      const handlerPart = segments[part] || {}
      segments[part] = addHandler(handlerPart, urlSegments.slice(1), handler)
    }
    return segments
  }
}

const selectHandler = (
  method: string,
  methodHandlers: any,
  route: string,
  handler: Handler<IncomingRequest, any>
) => {
  if (method === types.NOT_FOUND) {
    return handler
  } else {
    const routeSegments = getRouteSegments(route)
    return addHandler(methodHandlers, routeSegments, handler)
  }
}

const createRouterHash = (acc: any, { method, route, handler }: Matcher) => {
  const methodHandlers = acc[method] || {}
  const updatedHandlers = selectHandler(method, methodHandlers, route, handler)
  acc[method] = updatedHandlers
  return acc
}

const getHandlerWithMethod = (allHandlers: any, request: any): any => {
  helpers.debug('-----> Enter in getHandlerWithMethod')
  if (typeof allHandlers === 'function' || request.routeSegments.length === 0) {
    return allHandlers
  }

  const value = request.routeSegments.shift()
  const globalMatcher = allHandlers?.global
  if (globalMatcher) {
    request.context[globalMatcher.name] = value
    return getHandlerWithMethod(allHandlers.global.parts, request)
  } else {
    if (allHandlers[value]) {
      return getHandlerWithMethod(allHandlers[value], request)
    } else {
      return null
    }
  }
}

const getHandler = (request: IncomingRequest, routesSwitch: any) => {
  helpers.debug('-----> Enter getHandler')
  // @ts-ignore
  const routeSegments = request.routeSegments.slice(0)
  const anyHandler = getHandlerWithMethod(
    routesSwitch[types.ANY] || {},
    request
  )
  if (anyHandler) {
    return anyHandler
  } else {
    // @ts-ignore
    request.routeSegments = routeSegments
    return getHandlerWithMethod(
      request.method ? routesSwitch[request.method] : {},
      request
    )
  }
}

const responseOrNotFound = (routesSwitch: any, request: any, response: any) => {
  helpers.debug('-----> Enter responseOrNotFound')
  if (!response && routesSwitch[types.NOT_FOUND]) {
    return routesSwitch[types.NOT_FOUND](request)
  } else {
    return response
  }
}

const getOrComputeRouteSegments = (request: any) =>
  request.routeSegments ||
  getRouteSegments(addTrailingSlash(request.url.pathname))

const removeSegments = (request: any) => {
  if (request.routeSegments.length === 0) {
    const newRequest = { ...request }
    delete newRequest.routeSegments
    return newRequest
  } else {
    return request
  }
}

const computeRouteRequest = (rawRequest: any) => {
  const routeSegments = getOrComputeRouteSegments(rawRequest)
  const request = {
    ...rawRequest,
    routeSegments,
    context: {
      ...rawRequest.context,
    },
  }
  return request
}

const routeRequest = (routesSwitch: any) => (rawRequest: IncomingRequest) => {
  helpers.debug('-----> Enter routeRequest')
  const request = computeRouteRequest(rawRequest)
  const handler = getHandler(request, routesSwitch)
  if (handler) {
    const finalRequest = removeSegments(request)
    const response = handler(finalRequest)
    return responseOrNotFound(routesSwitch, finalRequest, response)
  } else {
    return responseOrNotFound(routesSwitch, request, null)
  }
}

export const routes = (allRoutes: Matcher[]): Handler<IncomingRequest, any> => {
  const routesSwitch = allRoutes.reduce(createRouterHash, {})
  helpers.debug(routesSwitch)
  const router: Handler<IncomingRequest, any> = routeRequest(routesSwitch)
  // @ts-ignore
  router.toJSON = toJSON(routesSwitch)
  // @ts-ignore
  router.exportRoutes = exportRoutes(routesSwitch)
  return router
}

const addTrailingSlash = (route: string) => {
  if (route.length > 1) {
    if (route.endsWith('/')) {
      return route
    } else {
      return `${route}/`
    }
  } else {
    return route
  }
}

export type Matcher = {
  method: types.Method
  route: string
  handler: Handler<IncomingRequest, ServerResponse<any>>
}

const matcher = (method: types.Method) => {
  return (
    route: string,
    handler: Handler<IncomingRequest, ServerResponse<any>>
  ): Matcher => ({
    method: method,
    route: addTrailingSlash(route),
    handler: handler,
  })
}

export const get = matcher(types.GET)
export const post = matcher(types.POST)
export const patch = matcher(types.PATCH)
export const put = matcher(types.PUT)
export const del = matcher(types.DELETE)
export const options = matcher(types.OPTIONS)
export const any = matcher(types.ANY)

export const notFound = <Type>(
  handler: Handler<IncomingRequest, ServerResponse<Type>>
): Matcher => ({
  method: types.NOT_FOUND,
  route: '',
  handler: handler,
})

const removeTrailingSlash = (matcher: Matcher): Matcher => {
  if (matcher.route === '/') {
    return matcher
  } else {
    return {
      ...matcher,
      route: matcher.route.slice(0, -1),
    }
  }
}

export const context = <Type>(
  endpoint: string,
  routesOrHandler: Handler<IncomingRequest, ServerResponse<Type>> | Matcher[]
): Matcher => {
  switch (typeof routesOrHandler) {
    case 'function':
      return removeTrailingSlash(any(endpoint, routesOrHandler))
    case 'object':
      return removeTrailingSlash(any(endpoint, routes(routesOrHandler)))
    default:
      throw 'Context Error'
  }
}

export const compose = <Type>(
  routes: Handler<IncomingRequest, ServerResponse<Type>>[]
): Handler<IncomingRequest, ServerResponse<Type>> => {
  return (request: IncomingRequest) => {
    const firstRouter = routes[0]
    if (firstRouter) {
      const result = firstRouter(request)
      if (result) {
        return result
      } else {
        return compose(routes.slice(1))(request)
      }
    } else {
      return response.internalError('compose')
    }
  }
}
