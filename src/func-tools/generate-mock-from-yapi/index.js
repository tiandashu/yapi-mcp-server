/**
 * 根据JSON Schema生成Mock数据
 * @param {Object} property - JSON Schema属性对象
 * @param {string} propertyName - 属性名
 * @returns {any} - 生成的Mock数据
 */
function generateMockFromProperty(property, propertyName = '') {
	if (!property) return null

	const { type, format, items, properties, description, enum: enumValues } = property

	// 如果有枚举值，随机选择一个
	if (enumValues && Array.isArray(enumValues)) {
		return enumValues[Math.floor(Math.random() * enumValues.length)]
	}

	switch (type) {
		case 'string':
			if (format === 'date-time') {
				return new Date().toISOString()
			} else if (format === 'date') {
				return new Date().toISOString().split('T')[0]
			} else if (format === 'email') {
				return 'example@test.com'
			} else if (format === 'uri' || format === 'url') {
				return 'https://example.com'
			} else {
				// 根据字段名生成更贴切的mock数据
				const lowerName = propertyName.toLowerCase()
				if (lowerName.includes('name')) {
					return '测试名称'
				} else if (lowerName.includes('title')) {
					return '测试标题'
				} else if (lowerName.includes('desc') || lowerName.includes('description')) {
					return '测试描述'
				} else if (lowerName.includes('id')) {
					return 'test_id_' + Math.random().toString(36).substr(2, 9)
				} else if (lowerName.includes('code')) {
					return 'TEST_CODE'
				} else if (lowerName.includes('status')) {
					return 'active'
				} else if (lowerName.includes('message')) {
					return '操作成功'
				} else {
					return description || '测试字符串'
				}
			}

		case 'number':
			if (format === 'int32' || format === 'int64') {
				return Math.floor(Math.random() * 1000) + 1
			}
			return Math.round(Math.random() * 100 * 100) / 100 // 保留两位小数

		case 'integer':
			return Math.floor(Math.random() * 1000) + 1

		case 'boolean':
			return Math.random() > 0.5

		case 'array':
			const arrayLength = Math.floor(Math.random() * 3) + 1 // 1-3个元素
			const arrayResult = []
			for (let i = 0; i < arrayLength; i++) {
				if (items) {
					arrayResult.push(generateMockFromProperty(items, propertyName))
				} else {
					arrayResult.push('array_item_' + i)
				}
			}
			return arrayResult

		case 'object':
			if (properties) {
				return generateMockObject(properties)
			}
			return {}

		default:
			return null
	}
}

/**
 * 生成Mock对象
 * @param {Object} properties - 对象属性定义
 * @returns {Object} - Mock对象
 */
function generateMockObject(properties) {
	const result = {}

	Object.entries(properties).forEach(([key, prop]) => {
		result[key] = generateMockFromProperty(prop, key)
	})

	return result
}

/**
 * 根据完整响应Schema生成Mock数据
 * @param {string} schemaStr - JSON Schema字符串
 * @param {string} dataKey - 数据字段名
 * @returns {Object} - 完整的Mock响应数据
 */
function generateFullMockResponse(schemaStr, dataKey = 'data') {
	try {
		const schema = JSON.parse(schemaStr)

		if (!schema.properties) {
			throw new Error('Schema格式不正确，缺少properties字段')
		}

		// 生成完整的响应结构
		const mockResponse = generateMockObject(schema.properties)

		// 确保基本的API响应结构
		if (!mockResponse.code && schema.properties.code) {
			mockResponse.code = '200'
		}
		if (!mockResponse.message && schema.properties.message) {
			mockResponse.message = '操作成功'
		}
		if (!mockResponse.status && schema.properties.status) {
			mockResponse.status = 1
		}

		return mockResponse
	} catch (error) {
		throw new Error(`解析Schema失败: ${error.message}`)
	}
}

/**
 * 仅生成数据部分的Mock数据
 * @param {string} schemaStr - JSON Schema字符串
 * @param {string} dataKey - 数据字段名
 * @returns {any} - 数据部分的Mock数据
 */
function generateDataMock(schemaStr, dataKey = 'data') {
	try {
		const schema = JSON.parse(schemaStr)

		if (!schema.properties) {
			throw new Error('Schema格式不正确，缺少properties字段')
		}

		const dataProperty = schema.properties[dataKey]

		if (!dataProperty) {
			throw new Error(`Schema中未找到${dataKey}字段`)
		}

		return generateMockFromProperty(dataProperty, dataKey)
	} catch (error) {
		throw new Error(`解析Schema失败: ${error.message}`)
	}
}

/**
 * 美化JSON输出
 * @param {any} data - 要格式化的数据
 * @returns {string} - 格式化后的JSON字符串
 */
function beautifyJSON(data) {
	return JSON.stringify(data, null, 2)
}

/**
 * 生成Mock数据的MCP工具函数
 */
export const generateMockFromYApi = async (params) => {
	try {
		const {
			resBodySchema,
			dataKey = 'data',
			mockType = 'full', // 'full' | 'data-only'
			title,
			path,
			method,
		} = params

		if (!resBodySchema) {
			throw new Error('resBodySchema参数不能为空')
		}

		let mockData
		let description

		if (mockType === 'data-only') {
			// 只生成数据部分
			mockData = generateDataMock(resBodySchema, dataKey)
			description = `${dataKey}字段的Mock数据`
		} else {
			// 生成完整响应
			mockData = generateFullMockResponse(resBodySchema, dataKey)
			description = '完整API响应的Mock数据'
		}

		const beautifiedJSON = beautifyJSON(mockData)

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: true,
							message: '成功生成Mock数据',
							data: {
								title: title || `${method?.toUpperCase()} ${path}`,
								description: description,
								mockType: mockType,
								dataKey: dataKey,
								mockData: mockData,
								jsonString: beautifiedJSON,
							},
						},
						null,
						2
					),
				},
			],
		}
	} catch (error) {
		console.error('生成Mock数据错误:', error.message)
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: false,
							message: `生成Mock数据失败: ${error.message}`,
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
