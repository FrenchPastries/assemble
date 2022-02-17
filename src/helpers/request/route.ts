export const removeTrailingSlash = (route: string) => {
  if (route === '/') return route
  if (route.endsWith('/')) return route.slice(0, -1)
  return route
}
