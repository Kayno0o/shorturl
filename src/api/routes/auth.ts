import type { StringValue } from 'ms'
import { getRepository } from '@kaynooo/ts-module'
import { comparePasswords, hashPassword, stringToMsDuration } from '@kaynooo/utils'
import { Elysia, redirect, t } from 'elysia'
import jwt from 'jsonwebtoken'
import { authService, getUserFromJwt } from '../middleware/auth'
import { User } from '../orm/entities/user'
import { checkMfa, generateMfaSecret } from '../utils/mfa'

// Configuration
function getAuthConfig() {
  return {
    jwtSecret: import.meta.env.JWT_SECRET,
    jwtExpiration: import.meta.env.JWT_EXPIRATION ?? '1h',
  }
}

// Password validation
function validatePassword(password: string): string | null {
  if (password.length >= 24)
    return null

  const hasNumber = /\d/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecialChar = /[!.\-_]/.test(password)

  if (!hasNumber || !hasLowercase || !hasUppercase || !hasSpecialChar) {
    return 'Password should contain at least one lowercase letter, one uppercase letter, one digit, and one of !.-_, or be at least 24 characters'
  }

  return null
}

// JWT and cookie utilities
function createTokenAndSetCookie(userId: number, jwtToken: any, jwtExpiration: StringValue = '1h') {
  const { jwtSecret } = getAuthConfig()

  const maxAge = stringToMsDuration(jwtExpiration)
  const expires = new Date(Date.now() + maxAge)
  const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpiration })

  jwtToken.value = token
  jwtToken.httpOnly = true
  jwtToken.secure = true
  jwtToken.sameSite = 'strict'
  jwtToken.expires = expires
  jwtToken.maxAge = Math.floor(maxAge / 1000)
}

// Auth service
class AuthService {
  async login(username: string, password: string) {
    const repo = getRepository(User.prototype)!
    const user = repo.findOneBy({ where: { username } })

    if (!user || !(await comparePasswords(password, user.password))) {
      throw new Error('Invalid identifier.')
    }

    return user
  }

  async register(username: string, password: string) {
    const repo = getRepository(User.prototype)!
    const existingUser = repo.findOneBy({ where: { username } })
    if (existingUser) {
      throw new Error('Username is already being used.')
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      throw new Error(passwordError)
    }

    const hashedPassword = await hashPassword(password)
    const user = repo.create(new User({ username, hashedPassword }))

    return user
  }
}

const service = new AuthService()

const authController = new Elysia({ prefix: '/auth' })
  .use(authService)
  .get('/mfa/create', ({ cookie: { mfaToken } }) => {
    const maxAge = stringToMsDuration('3m')
    const expires = new Date(Date.now() + maxAge)

    mfaToken.value = generateMfaSecret()
    mfaToken.httpOnly = true
    mfaToken.secure = true
    mfaToken.sameSite = 'strict'
    mfaToken.maxAge = maxAge
    mfaToken.expires = expires

    return redirect('/auth/mfa/enable')
  }, {
    requireAuth: true,
  })
  .post('/mfa/enable', ({ cookie: { mfaToken }, body: { digits }, auth }) => {
    if (!mfaToken.value || !checkMfa(digits, mfaToken.value))
      return redirect('/auth/mfa/enable')

    const user = auth.user!
    const repo = getRepository(User.prototype)!

    user.mfa_token = mfaToken.value
    repo.update(user.id, user)

    return redirect('/')
  }, {
    body: t.Object({
      digits: t.String({ minLength: 6, maxLength: 6 }),
    }),
    requireAuth: true,
  })
  .post('/mfa/validate', ({ cookie: { pendingMfaToken, jwtToken }, body: { digits } }) => {
    const user = getUserFromJwt(pendingMfaToken.value)
    if (!user)
      return redirect('/login')
    if (!user.mfa_token)
      return redirect('/')

    if (!checkMfa(digits, user.mfa_token))
      return redirect('/auth/mfa/validate')

    pendingMfaToken.remove()

    createTokenAndSetCookie(user.id, jwtToken)

    return redirect('/')
  }, {
    body: t.Object({
      digits: t.String({ minLength: 6, maxLength: 6 }),
    }),
  })
  .post('/login', async ({ body, cookie: { jwtToken, pendingMfaToken } }) => {
    const user = await service.login(body.username, body.password)

    if (user.mfa_token) {
      createTokenAndSetCookie(user.id, pendingMfaToken, '5m')
      return redirect('/auth/mfa/validate')
    }

    createTokenAndSetCookie(user.id, jwtToken)
    return redirect('/')
  }, {
    body: t.Object({
      username: t.String({ minLength: 2, maxLength: 16 }),
      password: t.String({ minLength: 6 }),
    }),
  })
  .post('/register', async ({ body, cookie: { jwtToken } }) => {
    try {
      const user = await service.register(body.username, body.password)
      createTokenAndSetCookie(user.id, jwtToken)
      return redirect('/')
    }
    catch (error) {
      return new Error(error instanceof Error ? error.message : 'Registration failed')
    }
  }, {
    body: t.Object({
      username: t.String({ minLength: 2, maxLength: 16 }),
      password: t.String({ minLength: 6, maxLength: 48 }),
    }),
  })
  .get('/logout', ({ cookie: { jwtToken } }) => {
    jwtToken.remove()

    return redirect('/')
  })

export default authController
