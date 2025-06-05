import path from 'node:path'
import { initDB } from '@kaynooo/ts-module'
import { Database } from 'bun:sqlite'
import { LinkRepository } from './repositories/linkRepository'
import { UserRepository } from './repositories/userRepository'

export async function initORM() {
  await initDB(new Database(path.resolve(import.meta.dirname, '..', '..', 'db.sqlite')), [
    new UserRepository(),
    new LinkRepository(),
  ])
}
