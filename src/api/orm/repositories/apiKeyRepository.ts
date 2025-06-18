import { AbstractRepository } from '@kaynooo/ts-module/orm'
import { ApiKey } from '../entities/apiKey'

export class ApiKeyRepository extends AbstractRepository<ApiKey> {
  constructor() {
    super(ApiKey.prototype)
  }
}
