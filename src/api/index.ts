import { getRepository } from '@kaynooo/ts-module'
import { Elysia, redirect } from 'elysia'
import { authService } from './middleware/auth'
import { initORM } from './orm'
import { Link } from './orm/entities/link'
import linkRoutes from './routes/l'
import authRoutes from './routes/login'

const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const port = portIndex !== -1 && args[portIndex + 1] ? Number(args[portIndex + 1]) : 3000

await initORM()

const app = new Elysia()
  .use(authService)
  .group('/api', app => app
    .use(linkRoutes)
    .use(authRoutes))
  .get('/:code', ({ params: { code } }) => {
    const repo = getRepository(Link.prototype)!
    const link = repo.findOneBy({ where: { code } })
    if (!link)
      return new Error('Link not found')

    return redirect(link.value)
  })

app.listen(port)

console.log('Starting API on port:', port)
