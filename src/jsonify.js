const jsonify = object => {
  if (typeof object === 'object') {
    return Object.keys(object).reduce((acc, val) => {
      const t = object[val]
      if (val === '') {
        return { ...acc, [val]: 'end' }
      } else if (t.export) {
        return { ...acc, [val]: t.toJSON() }
      } else {
        return { ...acc, [val]: jsonify(t) }
      }
    }, {})
  } else {
    return object
  }
}

const toJSON = (routesSwitch) => () => {
  return jsonify(routesSwitch)
}

module.exports = {
  jsonify,
  toJSON,
}
