import { generateFunctionName, capitalize } from '../../utils/naming.js'
import * as logger from '../../utils/logger.js'

/**
 * 生成API请求代码
 * @param {Object} params - 参数
 * @param {string} params.path - 接口路径
 * @param {string} params.method - 请求方法
 * @param {string} params.title - 接口标题
 * @param {Array} params.reqParams - 路径参数
 * @param {Array} params.reqQuery - 查询参数
 * @param {string} params.interfaceName - 接口类型名称
 * @param {string} [params.requestLib='axios'] - 请求库类型: axios | fetch
 * @returns {Promise<Object>} - 返回生成的API代码
 */
export const generateApiCode = async (params) => {
	try {
		const {
			path: apiPath,
			method = 'GET',
			title,
			reqParams = [],
			reqQuery = [],
			interfaceName,
			requestLib = 'axios',
		} = params

		if (!apiPath) {
			throw new Error('缺少接口路径参数')
		}

		// 生成函数名称
		const functionName = generateFunctionName(apiPath, method)

		// 生成API代码
		let apiCode = ''
		if (requestLib === 'axios') {
			apiCode = generateAxiosCode({
				functionName,
				apiPath,
				method,
				title,
				reqParams,
				reqQuery,
				interfaceName,
			})
		} else {
			apiCode = generateFetchCode({
				functionName,
				apiPath,
				method,
				title,
				reqParams,
				reqQuery,
				interfaceName,
			})
		}

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: true,
							message: 'API代码生成成功',
							data: {
								functionName,
								apiCode,
								requestLib,
								path: apiPath,
								method: method.toUpperCase(),
							},
						},
						null,
						2
					),
				},
			],
		}
	} catch (error) {
		logger.error('生成API代码错误:', error.message)
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: false,
							message: `生成API代码失败: ${error.message}`,
							error: error.message,
						},
						null,
						2
					),
				},
			],
		}
	}
}

/**
 * 生成axios请求代码
 */
function generateAxiosCode({ functionName, apiPath, method, title, reqParams, reqQuery, interfaceName }) {
	const hasParams = reqParams.length > 0
	const hasQuery = reqQuery.length > 0
	const methodUpper = method.toUpperCase()

	// 生成参数接口
	let paramsInterface = ''
	if (hasParams || hasQuery) {
		const interfaceFields = []

		// 路径参数
		reqParams.forEach((param) => {
			interfaceFields.push(`  /** ${param.desc || param.name} */\n  ${param.name}: string | number`)
		})

		// 查询参数
		reqQuery.forEach((query) => {
			const optional = query.required === '0' ? '?' : ''
			interfaceFields.push(`  /** ${query.desc || query.name} */\n  ${query.name}${optional}: string | number`)
		})

		paramsInterface = `interface ${capitalize(functionName)}Params {
${interfaceFields.join('\n')}
}

`
	}

	// 生成函数参数
	const functionParams = hasParams || hasQuery ? `params: ${capitalize(functionName)}Params` : ''

	// 生成URL构造
	let urlConstruction = `'${apiPath}'`
	if (hasParams) {
		// 替换路径参数
		reqParams.forEach((param) => {
			urlConstruction = urlConstruction.replace(`{${param.name}}`, `\${params.${param.name}}`)
		})
		urlConstruction = '`' + urlConstruction.slice(1, -1) + '`'
	}

	// 生成请求配置
	let requestConfig = ''
	if (hasQuery) {
		const queryParams = reqQuery.map((q) => `${q.name}: params.${q.name}`).join(', ')
		requestConfig = `, {
    params: { ${queryParams} }
  }`
	}

	const returnType = interfaceName ? `Promise<${interfaceName}>` : 'Promise<any>'

	return `${paramsInterface}/**
 * ${title || `${methodUpper} ${apiPath}`}
 */
export const ${functionName} = async (${functionParams}): ${returnType} => {
  const response = await axios.${method.toLowerCase()}(${urlConstruction}${requestConfig})
  return response.data
}`
}

/**
 * 生成fetch请求代码
 */
function generateFetchCode({ functionName, apiPath, method, title, reqParams, reqQuery, interfaceName }) {
	const hasParams = reqParams.length > 0
	const hasQuery = reqQuery.length > 0
	const methodUpper = method.toUpperCase()

	// 生成参数接口
	let paramsInterface = ''
	if (hasParams || hasQuery) {
		const interfaceFields = []

		reqParams.forEach((param) => {
			interfaceFields.push(`  /** ${param.desc || param.name} */\n  ${param.name}: string | number`)
		})

		reqQuery.forEach((query) => {
			const optional = query.required === '0' ? '?' : ''
			interfaceFields.push(`  /** ${query.desc || query.name} */\n  ${query.name}${optional}: string | number`)
		})

		paramsInterface = `interface ${capitalize(functionName)}Params {
${interfaceFields.join('\n')}
}

`
	}

	const functionParams = hasParams || hasQuery ? `params: ${capitalize(functionName)}Params` : ''

	// 生成URL构造
	let urlConstruction = `'${apiPath}'`
	if (hasParams) {
		reqParams.forEach((param) => {
			urlConstruction = urlConstruction.replace(`{${param.name}}`, `\${params.${param.name}}`)
		})
		urlConstruction = '`' + urlConstruction.slice(1, -1) + '`'
	}

	// 生成查询参数处理
	let queryString = ''
	if (hasQuery) {
		queryString = `
  const searchParams = new URLSearchParams()
  ${reqQuery
		.map((q) => {
			if (q.required === '0') {
				return `if (params.${q.name} !== undefined) searchParams.append('${q.name}', String(params.${q.name}))`
			} else {
				return `searchParams.append('${q.name}', String(params.${q.name}))`
			}
		})
		.join('\n  ')}
  const queryString = searchParams.toString()
  const url = queryString ? \`\${baseUrl}?\${queryString}\` : baseUrl`
	} else {
		queryString = '\n  const url = baseUrl'
	}

	const returnType = interfaceName ? `Promise<${interfaceName}>` : 'Promise<any>'

	return `${paramsInterface}/**
 * ${title || `${methodUpper} ${apiPath}`}
 */
export const ${functionName} = async (${functionParams}): ${returnType} => {
  const baseUrl = ${urlConstruction}${queryString}

  const response = await fetch(url, {
    method: '${methodUpper}',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`)
  }

  return response.json()
}`
}
