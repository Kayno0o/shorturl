import { AbstractRepository } from '@kaynooo/ts-module/orm'
import { Link } from '../entities/link'

export class LinkRepository extends AbstractRepository<Link> {
  constructor() {
    super(Link.prototype)
  }
}
