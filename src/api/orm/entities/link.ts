import { AbstractEntity, Column, Entity } from '@kaynooo/ts-module/orm'

@Entity('link')
export class Link extends AbstractEntity {
  @Column('text', { nullable: false, unique: true })
  code: string

  @Column('text', { nullable: false, unique: false })
  value: string

  @Column('int', { nullable: false, reference: { key: 'id', table: 'user' } })
  owner: number

  constructor(data: { code: string, value: string, owner: number }) {
    super()

    this.code = data.code
    this.value = data.value
    this.owner = data.owner
  }
}
