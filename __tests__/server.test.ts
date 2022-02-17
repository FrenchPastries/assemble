import fetch from 'node-fetch'
import * as mf from '@frenchpastries/millefeuille'
import * as response from '@frenchpastries/millefeuille/response'
import { routes, get, post, put, del, context } from '../dist/assemble'

const handler = async (request: mf.IncomingRequest) => {
  console.log(request.context)
  const { body } = request
  const result = JSON.stringify(body ?? { url: request.url })
  const res = response.response(result)
  const headers = { ...res.headers, 'Content-Type': 'application/json' }
  const res_ = { ...res, headers }
  return res_
}

const allRoutes = routes([
  get('/', handler),
  context('/post', [
    get('/', handler),
    post('/', handler),
    put('/', handler),
    put('/test', handler),
    del('/', handler),
  ]),
  context('/user', [
    get('/', handler),
    get('/test', handler),
    get('/:id', handler),
    post('/:id', handler),
  ]),
])

const server = mf.create(allRoutes)

setTimeout(() => mf.stop(server), 5000)

const main = async () => {
  console.log(allRoutes.export!())
  try {
    const response = await fetch('http://localhost:8080/user/test')
    const result = await response.text()
    console.log(response.status)
    console.log(result)
  } catch (error) {
    console.log(error)
  }
}

main()
