import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { memoryCache } from '../../utils/cache.js'
import * as logger from '../../utils/logger.js'

/**
 * 从YApi获取接口数据（带缓存）
 * @param {string} remoteUrl - YApi导出接口URL
 * @param {boolean} forceRefresh - 是否强制刷新，跳过缓存
 * @returns {Promise<Array>} - 返回接口数据数组
 */
async function fetchYApiData(remoteUrl, forceRefresh = false) {
	// 生成缓存键
	const cacheKey = `yapi:data:${remoteUrl}`

	// 如果不是强制刷新，先尝试从缓存获取
	if (!forceRefresh) {
		const cached = memoryCache.get(cacheKey)
		if (cached) {
			logger.info('从缓存获取YApi数据')
			return cached
		}
	}

	try {
		logger.info(`正在从YApi获取数据: ${remoteUrl}`)

		const response = await axios.get(remoteUrl, {
			timeout: 30000, // 30秒超时
			headers: {
				'User-Agent': 'YApi-MCP-Client/1.0.0',
			},
		})

		if (response.status !== 200) {
			throw new Error(`HTTP请求失败，状态码: ${response.status}`)
		}

		if (!Array.isArray(response.data)) {
			throw new Error('YApi返回数据格式不正确，期望为数组格式')
		}

		logger.success(`成功获取YApi数据，共${response.data.length}个分类`)

		// 存入缓存，默认30分钟过期
		memoryCache.set(cacheKey, response.data, 30 * 60 * 1000)

		return response.data
	} catch (error) {
		if (error.code === 'ECONNABORTED') {
			throw new Error('请求超时，请检查网络连接')
		} else if (error.response) {
			throw new Error(`请求失败: ${error.response.status} ${error.response.statusText}`)
		} else if (error.request) {
			throw new Error('网络请求失败，请检查网络连接')
		} else {
			throw new Error(`获取YApi数据失败: ${error.message}`)
		}
	}
}

/**
 * 查找指定接口
 * @param {Array} yapiData - YApi数据
 * @param {string} path - 接口路径
 * @param {string} method - 请求方法
 * @returns {Object|null} - 找到的接口对象
 */
function findInterface(yapiData, path, method) {
	for (const category of yapiData) {
		if (category.list && Array.isArray(category.list)) {
			for (const api of category.list) {
				if (api.path === path && api.method.toLowerCase() === method.toLowerCase()) {
					return {
						...api,
						categoryName: category.name,
						categoryDesc: category.desc,
					}
				}
			}
		}
	}
	return null
}

/**
 * 获取所有接口列表
 * @param {Array} yapiData - YApi数据
 * @returns {Array} - 接口列表
 */
function getAllInterfaces(yapiData) {
	const interfaces = []

	yapiData.forEach((category) => {
		if (category.list && Array.isArray(category.list)) {
			category.list.forEach((api) => {
				interfaces.push({
					id: api._id,
					title: api.title,
					path: api.path,
					method: api.method,
					categoryName: category.name,
					categoryDesc: category.desc,
					status: api.status,
					tag: api.tag,
				})
			})
		}
	})

	return interfaces
}

/**
 * 获取YApi数据的MCP工具函数
 */
export const getYApiData = async (params) => {
	try {
		const { remoteUrl, interfacePath, method, listAll, forceRefresh = false } = params

		if (!remoteUrl) {
			throw new Error('remoteUrl参数不能为空')
		}

		// 获取YApi数据（带缓存）
		const yapiData = await fetchYApiData(remoteUrl, forceRefresh)

		if (listAll) {
			// 返回所有接口列表
			const interfaces = getAllInterfaces(yapiData)
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								message: `成功获取${interfaces.length}个接口`,
								data: {
									total: interfaces.length,
									interfaces: interfaces,
								},
							},
							null,
							2
						),
					},
				],
			}
		} else if (interfacePath && method) {
			// 查找指定接口
			const apiInterface = findInterface(yapiData, interfacePath, method)

			if (!apiInterface) {
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									success: false,
									message: `未找到接口: ${method.toUpperCase()} ${interfacePath}`,
								},
								null,
								2
							),
						},
					],
				}
			}

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								message: '成功获取接口详情',
								data: apiInterface,
							},
							null,
							2
						),
					},
				],
			}
		} else {
			// 返回完整的YApi数据
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								message: '成功获取YApi完整数据',
								data: yapiData,
							},
							null,
							2
						),
					},
				],
			}
		}
	} catch (error) {
		logger.error('获取YApi数据错误:', error.message)
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: false,
							message: `获取YApi数据失败: ${error.message}`,
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
