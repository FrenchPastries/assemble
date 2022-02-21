import fetch from 'node-fetch'
import * as mf from '@frenchpastries/millefeuille'
import * as handlers from './utils/handlers'
import * as routes from './utils/routes'

type Path = [string, string, number?, number?]
const paths: Path[] = [
  ['/', 'get', 0, 0],
  ['/post', 'post-get', 1, 1],
  ['/post', 'post-post', 2, 2],
  ['/post', 'post-put', 3, 3],
  ['/post/test', 'post-test-put', 4, 4],
  ['/post', 'post-delete', 5, 5],
  ['/user', 'user-get', 6, 5],
  ['/user/test', 'user-test-get', 7, 5],
  ['/user/before-global', 'user-before-global-get', 8, 6],
  ['/user/2', 'user-id-get', 9, 6],
  ['/user/2', 'user-id-post', 10, 6],
  ['/user/after-global', 'user-id-get', 11, 6],
  ['/user/after-global', 'user-after-global-delete', 12, 7],
  ['/user/2/meh', 'user-id-meh-put', 13, 7],
  ['/nested', 'nested-get', 13, 7],
  ['/nested/inside', 'nested-inside-get', 13, 7],
]

const query = async (path: Path) => {
  const [endpoint, ret] = path
  const [method] = ret.split('-').reverse()
  const end = `http://localhost:8080${endpoint}`
  const result = await fetch(end, { method })
  return result
}

let server: any
describe('Assemble', () => {
  beforeAll(() => (server = mf.create(routes.all)))
  afterAll(() => (server = mf.stop(server)))
  beforeEach(() => handlers.reset())

  test('handler should export routes', () => {
    const result = routes.all.export!()
    expect(result).not.toBeNull()
  })

  test('handler should return the correct path', async () => {
    for (const path of paths) {
      const [_endpoint, ret] = path
      const result = await query(path)
      expect(result.status).toEqual(200)
      expect(result.ok).toBeTruthy()
      const body = await result.json()
      expect(body.url).not.toBeNull()
      expect(body.path).toEqual(ret)
    }
  })

  test('middlewares should be correctly applied', async () => {
    for (const path of paths) {
      const [_endpoint, _ret, count1, count2] = path
      await query(path)
      expect(count1).toEqual(handlers.counter1)
      expect(count2).toEqual(handlers.counter2)
    }
    const result = await fetch('http://localhost:8080/post')
    expect(result.status).toEqual(500)
  })

  test('parts of path should be correctly extracted as number', async () => {
    const result = await query(['/user/2', 'user-id-get'])
    const body = await result.json()
    expect(body.ctx).toMatchObject({ id: 2 })
  })

  test('parts of path should be correctly extracted as string', async () => {
    const result = await query(['/user/2a', 'user-id-get'])
    const body = await result.json()
    expect(body.ctx).toMatchObject({ id: '2a' })
  })

  test('not found should be deeply found', async () => {
    const result = await query(['/post/anything', ''])
    const body = await result.text()
    expect(result.status).toEqual(404)
    expect(body).toEqual('post')
  })

  test('not found should return main handler', async () => {
    const result = await query(['/users/anyting', ''])
    const body = await result.text()
    expect(result.status).toEqual(404)
    expect(body).toEqual('main')
  })
})
