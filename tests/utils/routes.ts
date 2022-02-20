import * as asble from '../../src/assemble'
import { handler, middleware1, middleware2 } from './handlers'

export const all = asble.routes([
  asble.get('/', handler('get')),
  asble.context('/post', middleware1, middleware2, [
    asble.get('/', handler('post-get')),
    asble.post('/', handler('post-post')),
    asble.put('/', handler('post-put')),
    asble.put('/test', handler('post-test-put')),
    asble.del('/', handler('post-delete')),
    asble.notFound(async () => ({ statusCode: 404, body: 'post' })),
  ]),
  asble.context('/user', middleware1, [
    asble.get('/', handler('user-get')),
    asble.get('/test', handler('user-test-get')),
    asble.context('/before-global', middleware2, [
      asble.get('/', handler('user-before-global-get')),
    ]),
    asble.get('/:id', handler('user-id-get')),
    asble.post('/:id', handler('user-id-post')),
    asble.context('/after-global', middleware2, [
      asble.get('/', handler('user-after-global-get')),
      asble.del('/', handler('user-after-global-delete')),
    ]),
  ]),
  asble.notFound(async () => ({ statusCode: 404, body: 'main' })),
])
