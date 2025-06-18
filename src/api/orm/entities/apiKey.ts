import { AbstractEntity, Column, Entity } from '@kaynooo/ts-module'
import { randomString } from '@kaynooo/utils'

@Entity('api_key', {
  unique: [
    ['name', 'owner'],
  ],
})
export class ApiKey extends AbstractEntity {
  @Column('text', { nullable: false })
  name: string

  @Column('text', { nullable: false })
  code: string

  @Column('int', { nullable: false, reference: { key: 'id', table: 'user' } })
  owner: number

  constructor(data: { name: string, owner: number }) {
    super()

    this.name = data.name
    this.code = `${randomString(8, undefined, true)}-${randomString(16, undefined, true)}-${randomString(4, undefined, true)}`
    this.owner = data.owner
  }
}
