/**
 * 将JSON Schema属性类型转换为TypeScript类型
 * @param {Object} property - JSON Schema属性对象
 * @param {string} dataKey - 数据字段名
 * @returns {string} - TypeScript类型字符串
 */
function jsonSchemaToTypeScript(property, dataKey = 'data') {
	if (!property) return 'any'

	const { type, format, items, properties, description } = property

	switch (type) {
		case 'string':
			if (format === 'date-time' || format === 'date') {
				return 'string' // 可以考虑使用 Date，但通常API返回字符串
			}
			return 'string'

		case 'number':
		case 'integer':
			return 'number'

		case 'boolean':
			return 'boolean'

		case 'array':
			if (items) {
				const itemType = jsonSchemaToTypeScript(items, dataKey)
				return `${itemType}[]`
			}
			return 'any[]'

		case 'object':
			if (properties) {
				return generateObjectInterface(properties, dataKey)
			}
			return 'Record<string, any>'

		default:
			return 'any'
	}
}

/**
 * 生成对象接口定义
 * @param {Object} properties - 对象属性
 * @param {string} dataKey - 数据字段名
 * @param {number} indent - 缩进级别
 * @returns {string} - 接口定义字符串
 */
function generateObjectInterface(properties, dataKey, indent = 0) {
	const spaces = '  '.repeat(indent)
	let result = '{\n'

	Object.entries(properties).forEach(([key, prop]) => {
		const comment = prop.description ? `${spaces}  /** ${prop.description} */\n` : ''
		const optional = prop.required === false ? '?' : ''
		const propType = jsonSchemaToTypeScript(prop, dataKey)

		result += `${comment}${spaces}  ${key}${optional}: ${propType};\n`
	})

	result += `${spaces}}`
	return result
}

/**
 * 从JSON Schema字符串生成TypeScript接口
 * @param {string} schemaStr - JSON Schema字符串
 * @param {string} dataKey - 要提取的数据字段名
 * @param {string} interfaceName - 接口名称
 * @returns {string} - TypeScript接口定义
 */
function generateInterfaceFromSchema(schemaStr, dataKey = 'data', interfaceName = 'ApiResponse') {
	try {
		const schema = JSON.parse(schemaStr)

		if (!schema.properties) {
			throw new Error('Schema格式不正确，缺少properties字段')
		}

		// 获取指定dataKey的属性
		const dataProperty = schema.properties[dataKey]

		if (!dataProperty) {
			throw new Error(`Schema中未找到${dataKey}字段`)
		}

		// 生成接口
		const dataType = jsonSchemaToTypeScript(dataProperty, dataKey)

		return `export interface ${interfaceName} ${dataType}`
	} catch (error) {
		throw new Error(`解析Schema失败: ${error.message}`)
	}
}

/**
 * 驼峰命名转换
 * @param {string} str - 原字符串
 * @returns {string} - 驼峰命名字符串
 */
function toCamelCase(str) {
	return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase()).replace(/^(.)/, (char) => char.toUpperCase())
}

/**
 * 根据接口路径生成接口名称
 * @param {string} path - 接口路径
 * @param {string} method - 请求方法
 * @returns {string} - 接口名称
 */
function generateInterfaceName(path, method) {
	// 移除路径参数 {id} -> Id
	const cleanPath = path.replace(/\{([^}]+)\}/g, (_, param) => toCamelCase(param))

	// 分割路径并转换为驼峰命名
	const pathParts = cleanPath.split('/').filter((part) => part)
	const pathName = pathParts.map((part) => toCamelCase(part)).join('')

	const methodName = method.toLowerCase()
	const prefix = methodName === 'get' ? '' : toCamelCase(methodName)

	return `${prefix}${pathName}Data`
}

/**
 * 生成TypeScript类型定义的MCP工具函数
 */
export const generateTypes = async (params) => {
	try {
		const { resBodySchema, dataKey = 'data', interfaceName, path, method, title } = params

		if (!resBodySchema) {
			throw new Error('resBodySchema参数不能为空')
		}

		// 生成接口名称
		const finalInterfaceName = interfaceName || (path && method ? generateInterfaceName(path, method) : 'ApiData')

		// 生成TypeScript接口定义
		const typeDefinition = generateInterfaceFromSchema(resBodySchema, dataKey, finalInterfaceName)

		// 添加注释
		const comment = title ? `/** ${title} */\n` : ''
		const fullDefinition = `${comment}${typeDefinition}`

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: true,
							message: '成功生成TypeScript类型定义',
							data: {
								interfaceName: finalInterfaceName,
								typeDefinition: fullDefinition,
								dataKey: dataKey,
							},
						},
						null,
						2
					),
				},
			],
		}
	} catch (error) {
		console.error('生成TypeScript类型定义错误:', error.message)
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: false,
							message: `生成TypeScript类型定义失败: ${error.message}`,
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
