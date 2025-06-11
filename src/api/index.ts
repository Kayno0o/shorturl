import { getRepository } from '@kaynooo/ts-module'
import { Elysia, redirect } from 'elysia'
import { authService } from './middleware/auth'
import { initORM } from './orm'
import { Link } from './orm/entities/link'
import authRoutes from './routes/auth'
import linkRoutes from './routes/link'

const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const port = portIndex !== -1 && args[portIndex + 1] ? Number(args[portIndex + 1]) : 3000

await initORM()

const app = new Elysia()
  .use(authService)
  .group('/api', app => app
    .use(linkRoutes)
    .use(authRoutes))
  .get('/:uid/:code', ({ params: { code,uid } }) => {
    const repo = getRepository(Link.prototype)!
    const link = repo.findOneBy({ where: { code,owner:uid } })
    if (!link)
      return new Error('Link not found')

    setImmediate(() => {
      link.clickCount++
      repo.update(link.id, link)
    })

    return redirect(link.value)
  })

app.listen(port)

console.log('Starting API on port:', port)
