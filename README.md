# Assemble

Assemble is a library focused on your routes managing. Fully compatible with [`@frenchpastries/millefeuille`](https://github.com/FrenchPastries/millefeuille), it generates a handler able to route your request to the handler you need, according to the current url for any millefeuille-like server.  
It is named because a mille-feuille is an assembly of layers, just like your routes looks like a millefeuille! Let's dive into the API.

# Getting Started

As usual, get it into your projet.

```bash
# For Yarn users
yarn add @frenchpastries/assemble
```

```bash
# For NPM users
npm install --save @frenchpastries/assemble
```

Once you got the package locally, you can go into your text editor and open an `src/index.js` file. We also recommend getting [`@frenchpastries/millefeuille`](https://github.com/FrenchPastries/millefeuille) to get the best compatibility possible. In the rest of the guide, we'll assume you use millefeuille for your needs and know the framework. If not, we assume you can adapt the guide to your framework.

As a reminder, let's see what a `millefeuille` looks like. It consists in one function `MilleFeuille.create(handler)` taking a handler as argument. A handler is a function accepting a request as argument, and returns a Response object. And that's exactly what Assemble provides!

```javascript
const MilleFeuille = require('@frenchpastries/millefeuille')
const { response } = require('@frenchpastries/millefeuille/response')
const { get, ...Assemble } = require('@frenchpastries/assemble')

const handleUsers = request => response('I’m handling users!')
const handleRoot = request =>
  response('Hello World from MilleFeuille with Assemble!')

const allRoutes = Assemble.routes([
  get('/', handleRoot),
  get('/users', handleUsers),
])

MilleFeuille.create(allRoutes)
```

Run `node src/index.js`, and try to reach `localhost:8080`. You should see 'Hello World from MilleFeuille with Assemble!'. And now, try to reach `localhost:8080/users`, and you should see 'I’m handling users!'. So yes! You've made your first routing using Assemble!

# How does it work?

Assemble is simple to understand: the main function is `routes`. It takes an array of routes as arguments, and returns a handler function. A route is defined using the corresponding functions: `get`, `post`, `options`, etc. It takes a route, beginning by a slash (`/`), and a handler. The same handler type you would use directly in MilleFeuille.

When a new request comes in, Assemble will do some magic, and routes your request to the correct handler directly according to the URL and the route. Be careful to not duplicate routes. You'll end up with an undefined behavior!

# Plugging a middleware

Like in MilleFeuille, you can easily plug a middleware on any handler, `routes` included. It works in the exact same way. I'll take you to the documentation of [`@frenchpastries/millefeuille`](https://github.com/FrenchPastries/millefeuille#adding-a-middleware) describing how to add a middleware.

# Getting some URL variables

In some URL, you want to keep some variables. For instance, in `/user/id`, you want to keep the id most of the time. You can do it easily with Assemble. Just prefix your variable name with a colon (`:`), and Assemble will automatically add the variable inside the `request.context` variable when serving the route in the handler. So, in this case, you'll write `/user/:id`, and you can access the id in the handler, using `request.context.id`! So, if your user access the URL `/user/9`, `request.context.id` will be set to 9.

# Adding a context

Often, you'll write a lots of routes with the same prefix. For instance, `/user/:id/profile`, `/user/:id/edit`, `/user/:id/comments`, etc. You can group them directly using `context`. `context` is provided by Assemble like `routes`, and can be used in a similar way. `context` accepts both an array of routes, or a router directly. In the first case, it will generates a handler and serving it. In the other case, it will just use the handler as is.  
In `context`, just like in your routes, you can save variables in URL, and they will be passed through `request.context` in the exact same way as route handler!
You can also easily apply middlewares to a `context`, and generates handlers protected for example. The syntax is a little bit different: you have to pass the middlewares as middle arguments to the function.

```javascript
const { context, get, ...Assemble } = require('@frenchpastries/assemble')

const usersRoutes = Assemble.routes([
  get('/profile', userProfileHandler),
  get('/edit', userEditHandler),
])

const allRoutes = Assemble.routes([
  get('/', rootHandler),
  get('/user', userHandler),

  // Using an array.
  context('/user/:id', [
    get('/profile', userProfileHandler),
    get('/edit', userEditHandler),
  ]),

  // Using a handler.
  context('/user/:id', usersRoutes),

  // Connecting some middlewares.
  context('/path', middleware1, middleware2, [
    get('/here', handler),
    post('/there', handler),
  ]),
])
```

# Export the routes

To provide an easier access to what get compiled, you can export all the routes in a readable format. To do so, just run `.routes()` on the router, and tada! You got the routes ready! You can also access the routes in an other format: just use `.export()` on the router, and you got the `Export` object!

```javascript
const allRoutes = Assemble.routes([
  get('/user', handler),
  context('/post', [
    get('/', handler),
    get('/post', handler),
    post('/post', handler),
  ]),
])

allRoutes.routes()
// { GET:
//    [ '/user',
//      '/post',
//      '/post/post' ],
//   POST:
//    [ '/post/post' ] }

allRoutes.export()
// [
//   [ { method: 'GET', path: '/user', handler: function() } ],
//   [ { method: 'GET', path: '/post', handler: function() } ],
//   [ { method: 'GET', path: '/post/post', handler: function() } ],
//   [ { method: 'POST', path: '/post/post', handler: function() } ],
// ]
```

# Last details

You can provide two special routes: `any` and `notFound`. The first one will simply route any request to the handler, while the second will be fired each time the user request a route which does not exist. You can use them in the same way as the others.

```javascript
const { any, notFound, ...Assemble } = require('@frenchpastries/assemble')

const allRoutes = Assemble.routes([
  any('/', rootHandler),
  notFound(notFoundHandler),
])
```

In this example, every requests excepting `/` will be routed to `notFound`, providing a fallback for all your requests.

# Contributing

You love Assemble? Feel free to contribute: open issues or propose pull requests! At French Pastries, we love hearing from you!
