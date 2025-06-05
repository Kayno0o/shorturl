import { AbstractRepository } from '@kaynooo/ts-module/orm'
import { User } from '../entities/user'

export class UserRepository extends AbstractRepository<User> {
  constructor() {
    super(User.prototype)
  }
}
