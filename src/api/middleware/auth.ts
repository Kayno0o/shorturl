import { getRepository } from '@kaynooo/ts-module'
import { Elysia } from 'elysia'
import jwt from 'jsonwebtoken'
import { User } from '../orm/entities/user'

export function getUserFromJwt(jwtToken?: string): User | null {
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

export const authService = new Elysia({ name: 'Service.Auth' })
  .derive({ as: 'scoped' }, ({ cookie: { jwtToken } }) => ({
    auth: {
      user: getUserFromJwt(jwtToken.value),
    },
  }))
  .macro(({ onBeforeHandle }) => ({
    requireAuth(value = true) {
      if (!value)
        return

      onBeforeHandle(({ auth, set }) => {
        set.status = 401
        if (!auth?.user)
          return 'Unauthorized'
      })
    },
  }))
