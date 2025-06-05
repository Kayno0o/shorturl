import { getRepository } from '@kaynooo/ts-module'
import { Elysia, redirect, t } from 'elysia'
import xxhashWasm from 'xxhash-wasm'
import { authService } from '../middleware/auth'
import { Link } from '../orm/entities/link'

const xxhash = await xxhashWasm()

const linkController = new Elysia({ prefix: '/l' })
  .use(authService)
  .get('/:code', ({ params: { code } }) => {
    const repo = getRepository(Link.prototype)!
    const link = repo.findOneBy({ where: { code } })
    if (!link)
      return new Error('Link not found')

    return redirect(link.value)
  })
  .get('/', ({ auth }) => {
    const repo = getRepository(Link.prototype)!
    return repo.findAllBy({ where: { owner: auth.user!.id } })
  }, {
    requireAuth: true,
  })
  .get('/:code', ({ params: { code } }) => {
    const repo = getRepository(Link.prototype)!
    const link = repo.findOneBy({ where: { code } })
    if (!link)
      return new Error('Link not found')

    return redirect(link.value)
  })
  .post('/create', ({ body, auth }) => {
    const repo = getRepository(Link.prototype)!
    if (repo.findOneBy({ where: { code: body.code } }))
      return new Error('An error occurred')

    repo.create(new Link({ code: body.code || xxhash.h64ToString(body.value), value: body.value, owner: auth.user!.id }))

    return redirect('/')
  }, {
    body: t.Object({
      code: t.Optional(t.String({ minLength: 3, maxLength: 16 })),
      value: t.String({ format: 'uri' }),
    }),
    requireAuth: true,
  })

export default linkController
