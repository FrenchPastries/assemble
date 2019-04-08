const { jsonify } = require('./jsonify')

const getSubPaths = (acc, [ key, value ]) => {
  if (value === 'end') {
    return acc.concat([ '' ])
  } else if (value.global) {
    const { name, parts } = value.global
    const prefix = [ key, `:${name}` ].join('/')
    const subPaths = getAllPaths(prefix, parts)
    return acc.concat(subPaths)
  } else {
    const subPaths = getAllPaths(key, value)
    return acc.concat(subPaths)
  }
}

const getAllPaths = (prefix, paths) => {
  return Object
    .entries(paths)
    .reduce(getSubPaths, [])
    .map(elem => [ prefix, elem ].join('/'))
}

const computePaths = rest => {
  return Object.keys(rest).reduce((acc, method) => {
    return { ...acc, [method]: getAllPaths('', rest[method]) }
  }, {})
}

const VERBS = [ 'GET', 'POST', 'PATCH', 'PUT', 'DEL', 'OPTIONS', 'ANY' ]

const findVerb = route => {
  return VERBS.reduce((acc, val) => {
    if (acc) {
      return acc
    } else if (route.includes(val)) {
      return val
    } else {
      return null
    }
  }, null) || 'ANY'
}

const groupByVerb = ({ ANY }) => {
  return ANY.reduce((acc, val) => {
    const verb = findVerb(val)
    return {
      ...acc,
      [verb]: [
        ...(acc[verb] || []),
        val.replace(`${verb}/`, '')
      ]
    }
  }, {})
}

const warnForSimilarRoutes = (routes, categorizedContextRoutes) => {
  VERBS.forEach((verb) => {

  })
}

const normalizeMatcher = url => url.replace(/:[a-zA-z_]*/g, ':match')

const mergeRoutes = (routes, categorizedContextRoutes) => {
  return VERBS.reduce((acc, verb) => {
    const routesVerb = acc[verb] || []
    const catRoutesVerb = categorizedContextRoutes[verb] || []
    const finals = routesVerb.reduce((acc, val) => {
      if (acc.map(normalizeMatcher).includes(normalizeMatcher(val))) {
        return acc
      } else {
        return [ ...acc, val ]
      }
    }, catRoutesVerb)
    return {
      ...acc,
      [verb]: finals.sort(),
    }
  }, routes)
}

const transform = (allRoutes) => {
  const { ANY, ...rest } = JSON.parse(JSON.stringify(allRoutes))
  const routes = computePaths(rest)
  const allContextRoutes = computePaths({ ANY })
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

const exportRoutes = routesSwitch => () => {
  const jsonified = jsonify(routesSwitch)
  return transform(jsonified)
}

module.exports = {
  exportRoutes,
}
