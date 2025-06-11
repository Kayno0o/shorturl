import { getRepository } from '@kaynooo/ts-module'
import { Elysia, redirect, t } from 'elysia'
import xxhashWasm from 'xxhash-wasm'
import { authService } from '../middleware/auth'
import { Link } from '../orm/entities/link'

const xxhash = await xxhashWasm()

const linkController = new Elysia({ prefix: '/link' })
  .use(authService)
  .get('/:code', ({ auth, params: { code } }) => {
    const repo = getRepository(Link.prototype)!
    return repo.findOneBy({ where: { owner: auth.user!.id, code } })
  }, {
    requireAuth: true,
  })
  .get('/', ({ auth }) => {
    const repo = getRepository(Link.prototype)!
    return repo.findAllBy({ where: { owner: auth.user!.id } })
  }, {
    requireAuth: true,
  })
  .post('/create', ({ body, auth }) => {
    const repo = getRepository(Link.prototype)!
    if (repo.findOneBy({ where: { code: body.code } }))
      return new Error('An error occurred')

    repo.create(new Link({ code: body.code || xxhash.h64ToString(body.value), value: body.value, owner: auth.user!.id }))

    return redirect('/')
  }, {
    body: t.Object({
      code: t.Union([
        t.Literal(''),
        t.String({ minLength: 3, maxLength: 32 }),
      ]),
      value: t.String({ format: 'uri' }),
    }),
    requireAuth: true,
  })
  .post('/delete/:code', ({ params: { code }, auth }) => {
    const repo = getRepository(Link.prototype)!
    const link = repo.findOneBy({ where: { code, owner: auth.user!.id } })

    if (!link)
      return new Error('Link not found')

    repo.delete(link.id)
    return redirect('/')
  }, {
    requireAuth: true,
  })
  .post('/update/:code', ({ body: { code, value }, params: { code: originalCode }, auth }) => {
    const repo = getRepository(Link.prototype)!
    const link = repo.findOneBy({ where: { code: originalCode, owner: auth.user!.id } })

    if (!link)
      return new Error('Link not found')

    link.code = code
    link.value = value

    repo.update(link.id, link)
    return redirect('/')
  }, {
    body: t.Object({
      code: t.String({ minLength: 3, maxLength: 32 }),
      value: t.String({ format: 'uri' }),
    }),
    requireAuth: true,
  })

export default linkController
