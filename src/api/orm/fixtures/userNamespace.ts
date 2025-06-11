import { getRepository } from '@kaynooo/ts-module'
import { randomString } from '@kaynooo/utils'
import { User } from '../entities/user'

export default function () {
  const ur = getRepository(User.prototype)!
  const users = ur.findAll()

  for (const user of users) {
    user.namespace = randomString(4, undefined, true)
    ur.update(user.id, user)
  }
}
