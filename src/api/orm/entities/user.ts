import { AbstractEntity, Column, Entity } from '@kaynooo/ts-module/orm'

@Entity('user')
export class User extends AbstractEntity {
  @Column('text', { nullable: false, unique: true })
  username: string

  @Column('text', { nullable: false, unique: false })
  password: string

  constructor(data: { username: string, hashedPassword: string }) {
    super()

    this.username = data.username
    this.password = data.hashedPassword
  }
}
