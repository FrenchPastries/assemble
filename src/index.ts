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

const addHandler = <Request extends IncomingRequest>(
  segments: any,
  urlSegments: string[],
  handler: Handler<Request, any>
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

const selectHandler = <Request extends IncomingRequest>(
  method: string,
  methodHandlers: any,
  route: string,
  handler: Handler<Request, any>
) => {
  if (method === types.NOT_FOUND) {
    return handler
  } else {
    const routeSegments = getRouteSegments(route)
    return addHandler(methodHandlers, routeSegments, handler)
  }
}

const createRouterHash = <Request extends IncomingRequest>(
  acc: any,
  { method, route, handler }: Matcher<Request>
) => {
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
    if (allHandlers?.[value]) {
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
  getRouteSegments(addTrailingSlash(request.location.pathname))

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

const routeRequest = (routesSwitch: any) => {
  return async (rawRequest: IncomingRequest) => {
    helpers.debug('-----> Enter routeRequest')
    const request = computeRouteRequest(rawRequest)
    const handler = getHandler(request, routesSwitch)
    if (handler) {
      const finalRequest = removeSegments(request)
      const response = handler(finalRequest)
      if (response?.then) {
        return response.then((r: any) => {
          return responseOrNotFound(routesSwitch, finalRequest, r)
        })
      } else {
        return responseOrNotFound(routesSwitch, finalRequest, response)
      }
    } else {
      return responseOrNotFound(routesSwitch, request, null)
    }
  }
}

export const routes = <Request extends IncomingRequest>(
  allRoutes: Matcher<Request>[]
): Handler<Request, any> => {
  const routesSwitch = allRoutes.reduce(createRouterHash, {})
  helpers.debug(routesSwitch)
  const router: Handler<Request, any> = routeRequest(routesSwitch)
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

export type Matcher<Request extends IncomingRequest> = {
  method: types.Method
  route: string
  handler: Handler<Request, ServerResponse<any>>
}

const matcher = <Request extends IncomingRequest>(method: types.Method) => {
  return (
    route: string,
    handler: Handler<Request, ServerResponse<any>>
  ): Matcher<Request> => ({
    method: method,
    route: addTrailingSlash(route),
    handler: handler,
  })
}

export const get: <Request extends IncomingRequest>(
  route: string,
  handler: Handler<Request, ServerResponse<any>>
) => Matcher<Request> = matcher(types.GET)
export const post: <Request extends IncomingRequest>(
  route: string,
  handler: Handler<Request, ServerResponse<any>>
) => Matcher<Request> = matcher(types.POST)
export const patch: <Request extends IncomingRequest>(
  route: string,
  handler: Handler<Request, ServerResponse<any>>
) => Matcher<Request> = matcher(types.PATCH)
export const put: <Request extends IncomingRequest>(
  route: string,
  handler: Handler<Request, ServerResponse<any>>
) => Matcher<Request> = matcher(types.PUT)
export const del: <Request extends IncomingRequest>(
  route: string,
  handler: Handler<Request, ServerResponse<any>>
) => Matcher<Request> = matcher(types.DELETE)
export const options: <Request extends IncomingRequest>(
  route: string,
  handler: Handler<Request, ServerResponse<any>>
) => Matcher<Request> = matcher(types.OPTIONS)
export const any: <Request extends IncomingRequest>(
  route: string,
  handler: Handler<Request, ServerResponse<any>>
) => Matcher<Request> = matcher(types.ANY)

export const notFound = <Request extends IncomingRequest>(
  handler: Handler<Request, ServerResponse<any>>
): Matcher<Request> => ({
  method: types.NOT_FOUND,
  route: '',
  handler: handler,
})

const removeTrailingSlash = <Request extends IncomingRequest>(
  matcher: Matcher<Request>
): Matcher<Request> => {
  if (matcher.route === '/') {
    return matcher
  } else {
    return {
      ...matcher,
      route: matcher.route.slice(0, -1),
    }
  }
}

export const context = <Request extends IncomingRequest, Response>(
  endpoint: string,
  routesOrHandler:
    | Handler<Request, ServerResponse<Response>>
    | Matcher<Request>[]
): Matcher<Request> => {
  switch (typeof routesOrHandler) {
    case 'function':
      return removeTrailingSlash(any(endpoint, routesOrHandler))
    case 'object':
      return removeTrailingSlash(any(endpoint, routes(routesOrHandler)))
    default:
      throw 'Context Error'
  }
}

export const compose = <Request extends IncomingRequest, Response>(
  routes: Handler<Request, ServerResponse<Response>>[]
): Handler<Request, ServerResponse<Response>> => {
  return (request: Request) => {
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
