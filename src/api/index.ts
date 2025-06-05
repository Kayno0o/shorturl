import { Elysia } from 'elysia'
import { authService } from './middleware/auth'
import { initORM } from './orm'
import linkRoutes from './routes/l'
import authRoutes from './routes/login'

const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const port = portIndex !== -1 && args[portIndex + 1] ? Number(args[portIndex + 1]) : 3000

await initORM()

const app = new Elysia()
  .use(authService)
  .use(linkRoutes)
  .group('/api', app => app
    .use(linkRoutes)
    .use(authRoutes))

app.listen(port)

console.log('Starting API on port:', port)
