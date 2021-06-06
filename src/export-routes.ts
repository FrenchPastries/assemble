import chalk from 'chalk'
import { jsonify } from './jsonify'

const getSubPaths = (acc: any, [key, value]: [string, any]): string[] => {
  if (value === 'end') {
    return acc.concat([''])
  } else if (value.global) {
    const { name, parts } = value.global
    const prefix = [key, `:${name}`].join('/')
    const subPaths = getAllPaths(prefix, parts)
    return acc.concat(subPaths)
  } else {
    const subPaths = getAllPaths(key, value)
    return acc.concat(subPaths)
  }
}

const getAllPaths = (prefix: string, paths: any) => {
  return Object.entries(paths)
    .reduce(getSubPaths, [])
    .map(elem => [prefix, elem].join('/'))
}

const computePaths = (rest: any) => {
  return Object.keys(rest).reduce((acc, method) => {
    return { ...acc, [method]: getAllPaths('', rest[method]) }
  }, {})
}

const VERBS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'ANY']

const findVerb = (route: any) => {
  return (
    VERBS.reduce((acc: any, val) => {
      if (acc) {
        return acc
      } else if (route.includes(val)) {
        return val
      } else {
        return null
      }
    }, null) || 'ANY'
  )
}

const groupByVerb = ({ ANY }: any) => {
  return ANY.reduce((acc: any, val: any) => {
    const verb = findVerb(val)
    const verbsRemoved = val.replace(`${verb}/`, '').replace(/ANY\//g, '')
    return { ...acc, [verb]: [...(acc[verb] || []), verbsRemoved] }
  }, {})
}

const warnForSimilarRoutes = (routes: any, categorizedContextRoutes: any) => {
  VERBS.forEach(verb => {
    const routesVerb = routes[verb] || []
    const catRoutesVerb = categorizedContextRoutes[verb] || []
    const normalizedCatRoutesVerb = catRoutesVerb.map(normalizeMatcher)
    routesVerb.forEach((route: any) => {
      const normalizedRoute = normalizeMatcher(route)
      if (normalizedCatRoutesVerb.includes(normalizedRoute)) {
        console.warn(
          chalk.yellow.bold(
            `-----> ${route} is already matched by a context or any handler.
       Be careful, this route will never be reached.`
          )
        )
      }
    })
  })
}

const normalizeMatcher = (url: string) => url.replace(/:[a-zA-z_]*/g, ':match')

const mergeRoutes = (routes: any, categorizedContextRoutes: any) => {
  return VERBS.reduce((acc, verb) => {
    const routesVerb = acc[verb] || []
    const catRoutesVerb = categorizedContextRoutes[verb] || []
    const finals = routesVerb.reduce((acc: any, val: any) => {
      if (acc.map(normalizeMatcher).includes(normalizeMatcher(val))) {
        return acc
      } else {
        return [...acc, val]
      }
    }, catRoutesVerb)
    return {
      ...acc,
      [verb]: finals.sort(),
    }
  }, routes)
}

const transform = (allRoutes: any) => {
  const { ANY, ...rest } = JSON.parse(JSON.stringify(allRoutes))
  const routes = computePaths(rest)
  const anyHandler = ANY || {}
  const allContextRoutes = computePaths({ ANY: anyHandler })
  const categorizedContextRoutes = groupByVerb(allContextRoutes)
  warnForSimilarRoutes(routes, categorizedContextRoutes)
  const finalRoutes = mergeRoutes(routes, categorizedContextRoutes)
  return Object.keys(finalRoutes).reduce((acc, val) => {
    const urls = finalRoutes[val]
    if (urls.length === 0) {
      return acc
    } else {
      return {
        ...acc,
        [val]: urls,
      }
    }
  }, {})
}

export const exportRoutes = (routesSwitch: any) => () => {
  const jsonified = jsonify(routesSwitch)
  return transform(jsonified)
}
