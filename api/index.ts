import { getRepository } from '@kaynooo/ts-module'
import { Elysia, redirect, t } from 'elysia'
import jwt from 'jsonwebtoken'
import { initORM } from './orm'
import { Link } from './orm/entities/link'
import { User } from './orm/entities/user'

const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const port = portIndex !== -1 && args[portIndex + 1] ? Number(args[portIndex + 1]) : 3000

await initORM()

function getUserFromJwt(jwtToken?: string): User | null {
  if (!jwtToken)
    return null

  const secret = import.meta.env.JWT_SECRET
  if (!secret)
    return null

  try {
    const decoded = jwt.verify(jwtToken, secret) as undefined | (jwt.JwtPayload & { id: number })
    if (typeof decoded !== 'object')
      return null

    const repo = getRepository(User.prototype)!
    const user = repo.find(decoded.id)

    return user
  }
  catch (err) {
    return null
  }
}

const app = new Elysia({ prefix: '/api' })
  .get('/l/:code', (request) => {
    const repo = getRepository(Link.prototype)!
    const link = repo.findOneBy({ where: { code: request.params.code } })
    if (!link)
      return new Error('Link not found')

    return redirect(link.value)
    // ?? repo.create(new Link({ code: request.params.code, value: 'https://google.com' }))
  })
  .post('/l/create', ({ body, cookie: { jwtToken } }) => {
    const user = getUserFromJwt(jwtToken.value)
    if (!user)
      return new Error('User not found')

    const link = new Link({ ...body, owner: user.id })
    const repo = getRepository(Link.prototype)!

    return repo.create(link)
  }, {
    body: t.Object({
      code: t.String(),
      value: t.String(),
    }),
  })
  .post('/auth', ({ body }) => {
    return body
  }, {
    body: t.Object({
      username: t.String({ minLength: 6, pattern: '/ /' }),
    }),
  })

app.listen(port)

console.log('Starting API on port:', port)
