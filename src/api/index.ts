import { getRepository } from '@kaynooo/ts-module'
import { Elysia, redirect } from 'elysia'
import maxmind from 'maxmind'
import { authService } from './middleware/auth'
import { initORM } from './orm'
import { Link } from './orm/entities/link'
import { User } from './orm/entities/user'
import authRoutes from './routes/auth'
import linkRoutes from './routes/link'

const lookup = await maxmind.open('./node_modules/@ip-location-db/geolite2-country-mmdb/geolite2-country.mmdb')
function getCountryCodeFromIP(ip: string) {
  const result = lookup.get(ip)
  if (result && 'country_code' in result)
    return (result.country_code ?? null) as string | null
  return null
}

const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const port = portIndex !== -1 && args[portIndex + 1] ? Number(args[portIndex + 1]) : 3000

await initORM()

if (args.length) {
  const isFixture = args.findIndex(arg => arg === 'fixtures')

  if (isFixture >= 0) {
    const name = args[isFixture + 1]
    if (!name) {
      console.log('error', 'no fixture name given')
      process.exit()
    }

    const fixture = (await import(`./orm/fixtures/${name}`))?.default
    if (!fixture) {
      console.log('error', 'fixture not found or no default export')
      process.exit()
    }

    fixture()
    console.log('fixture', name, 'executed successfully')
    process.exit()
  }
}

const app = new Elysia()
  .use(authService)
  .group('/api', app => app
    .use(linkRoutes)
    .use(authRoutes))
  .get('/:code', ({ params: { code }, headers, request }) => {
    const [namespace, ...codeParts] = code.split('-')
    code = codeParts.join('-')

    const owner = getRepository(User.prototype)!.findOneBy({ where: { namespace } })
    if (!owner)
      return new Error('Link not found')

    const repo = getRepository(Link.prototype)!
    const link = repo.findOneBy({ where: { code, owner: owner.id } })
    if (!link)
      return new Error('Link not found')

    setImmediate(() => {
      link.clickCount++

      const ip = headers['x-forwarded-for']
        || headers['x-real-ip']
        || request.headers.get('cf-connecting-ip')
        || '127.0.0.1'
      const country = getCountryCodeFromIP(ip)
      if (country) {
        const analytics = JSON.parse(link.analytics)
        analytics.countries ||= {}
        analytics.countries[country] ||= 0
        analytics.countries[country]++
        link.analytics = JSON.stringify(analytics)
      }

      repo.update(link.id, link)
    })

    return redirect(link.value)
  })

app.listen(port)

console.log('Starting API on port:', port)
