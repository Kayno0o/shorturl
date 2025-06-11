import { AbstractEntity, Column, Entity } from '@kaynooo/ts-module/orm'
import { randomString } from '@kaynooo/utils'

@Entity('user')
export class User extends AbstractEntity {
  @Column('text', { nullable: false, unique: true })
  username: string

  @Column('text', { nullable: false, unique: false })
  password: string

  @Column('text', { nullable: true, unique: false })
  mfa_token: string | null = null

  @Column('text', { nullable: false, unique: true })
  namespace: string

  constructor(data: { username: string, hashedPassword: string }) {
    super()

    this.username = data.username
    this.password = data.hashedPassword
    this.namespace = randomString(4, undefined, true)
  }
}
