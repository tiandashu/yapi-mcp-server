/**
 * 命名转换相关的工具函数
 */

/**
 * 驼峰命名转换
 * @param {string} str - 原字符串
 * @returns {string} - 驼峰命名字符串
 */
export function toCamelCase(str) {
	return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase()).replace(/^(.)/, (char) => char.toUpperCase())
}

/**
 * 转换为小驼峰命名
 * @param {string} str - 原字符串
 * @returns {string} - 小驼峰命名字符串
 */
export function toLowerCamelCase(str) {
	return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase()).replace(/^(.)/, (char) => char.toLowerCase())
}

/**
 * 根据接口路径和方法生成接口名称
 * @param {string} path - 接口路径
 * @param {string} method - 请求方法
 * @returns {string} - 接口名称
 */
export function generateInterfaceName(path, method) {
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
 * 根据路径和方法生成函数名称
 * @param {string} path - 接口路径
 * @param {string} method - 请求方法
 * @returns {string} - 函数名称
 */
export function generateFunctionName(path, method) {
	// 移除路径参数 {xxx} 并转换为驼峰命名
	const cleanPath = path
		.replace(/\{[^}]+\}/g, '') // 移除路径参数
		.split('/')
		.filter(Boolean)
		.map((segment, index) => {
			// 第一个单词小写，其余首字母大写
			if (index === 0) {
				return segment.toLowerCase()
			}
			return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
		})
		.join('')

	// 添加方法前缀
	const methodPrefix = method.toLowerCase()
	if (methodPrefix === 'get') {
		return cleanPath.startsWith('get') ? cleanPath : `get${cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1)}`
	} else {
		return `${methodPrefix}${cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1)}`
	}
}

/**
 * 首字母大写
 * @param {string} str - 原字符串
 * @returns {string} - 首字母大写的字符串
 */
export function capitalize(str) {
	if (!str) return ''
	return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 首字母小写
 * @param {string} str - 原字符串
 * @returns {string} - 首字母小写的字符串
 */
export function uncapitalize(str) {
	if (!str) return ''
	return str.charAt(0).toLowerCase() + str.slice(1)
}
