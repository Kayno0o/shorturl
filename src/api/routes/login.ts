import { getRepository } from '@kaynooo/ts-module'
import { comparePasswords, hashPassword, stringToMsDuration } from '@kaynooo/utils'
import { Elysia, redirect, t } from 'elysia'
import jwt from 'jsonwebtoken'
import { User } from '../orm/entities/user'

// Configuration
function getAuthConfig() {
  return {
    jwtSecret: import.meta.env.JWT_SECRET,
    jwtExpiration: import.meta.env.JWT_EXPIRATION ?? '1h',
    isProduction: import.meta.env.NODE_ENV === 'production',
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
function createTokenAndSetCookie(userId: number, jwtToken: any) {
  const { jwtSecret, jwtExpiration, isProduction } = getAuthConfig()

  const maxAge = stringToMsDuration(jwtExpiration)
  const expires = new Date(Date.now() + maxAge)
  const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpiration })

  jwtToken.value = token
  jwtToken.httpOnly = true
  jwtToken.secure = isProduction
  jwtToken.sameSite = 'strict'
  jwtToken.expires = expires
  jwtToken.maxAge = Math.floor(maxAge / 1000) // Convert to seconds
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

const authService = new AuthService()

// Controller
const authController = new Elysia({ prefix: '/auth' })
  .post('/login', async ({ body, cookie: { jwtToken } }) => {
    try {
      const user = await authService.login(body.username, body.password)
      createTokenAndSetCookie(user.id, jwtToken)
      return redirect('/')
    }
    catch (error) {
      return new Error(error instanceof Error ? error.message : 'Login failed')
    }
  }, {
    body: t.Object({
      username: t.String({ minLength: 2, maxLength: 16 }),
      password: t.String({ minLength: 6 }),
    }),
  })
  .post('/register', async ({ body, cookie: { jwtToken } }) => {
    try {
      const user = await authService.register(body.username, body.password)
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
