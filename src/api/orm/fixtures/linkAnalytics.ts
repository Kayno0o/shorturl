import { getRepository } from '@kaynooo/ts-module'
import { Link } from '../entities/link'

export default function () {
  const repo = getRepository(Link.prototype)!
  const links = repo.findAll()

  for (const link of links) {
    link.analytics = '{"countries":{}}'
    repo.update(link.id, link)
  }
}
