import { readConfig } from './read-config/index.js'
import { getYApiData } from './get-yapi-data/index.js'
import { generateTypes } from './generate-types/index.js'
import { generateMockFromYApi } from './generate-mock-from-yapi/index.js'
import { generateApiCode } from './generate-api-code/index.js'

export default {
	readConfig,
	getYApiData,
	generateTypes,
	generateMockFromYApi,
	generateApiCode,
}
