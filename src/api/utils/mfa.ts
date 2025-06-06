import { authenticator } from 'otplib'

authenticator.options = {
  digits: 6,
  window: 1,
}

export function checkMfa(digits: string | number, secret: string) {
  return authenticator.check(String(digits), secret)
}

export function generateMfaSecret() {
  return authenticator.generateSecret()
}

export function getMfaUrl(account: string, issuer: string, secret: string) {
  return authenticator.keyuri(account, issuer, secret)
}
