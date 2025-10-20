/**
 * 缓存机制模块
 * 提供内存缓存和可选的文件缓存功能
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import * as logger from './logger.js'

/**
 * 内存缓存类
 */
class MemoryCache {
	constructor() {
		this.cache = new Map()
	}

	/**
	 * 设置缓存
	 * @param {string} key - 缓存键
	 * @param {any} value - 缓存值
	 * @param {number} ttl - 过期时间（毫秒），默认1小时
	 */
	set(key, value, ttl = 3600000) {
		this.cache.set(key, {
			value,
			expiresAt: Date.now() + ttl,
		})
		logger.debug(`缓存已设置: ${key}, TTL: ${ttl}ms`)
	}

	/**
	 * 获取缓存
	 * @param {string} key - 缓存键
	 * @returns {any|null} - 缓存值，如果不存在或已过期则返回null
	 */
	get(key) {
		const item = this.cache.get(key)

		if (!item) {
			logger.debug(`缓存未命中: ${key}`)
			return null
		}

		if (Date.now() > item.expiresAt) {
			logger.debug(`缓存已过期: ${key}`)
			this.cache.delete(key)
			return null
		}

		logger.debug(`缓存命中: ${key}`)
		return item.value
	}

	/**
	 * 检查缓存是否存在且有效
	 * @param {string} key - 缓存键
	 * @returns {boolean}
	 */
	has(key) {
		return this.get(key) !== null
	}

	/**
	 * 删除缓存
	 * @param {string} key - 缓存键
	 */
	delete(key) {
		const deleted = this.cache.delete(key)
		if (deleted) {
			logger.debug(`缓存已删除: ${key}`)
		}
		return deleted
	}

	/**
	 * 清空所有缓存
	 */
	clear() {
		const size = this.cache.size
		this.cache.clear()
		logger.info(`已清空所有缓存，共${size}项`)
	}

	/**
	 * 清理过期缓存
	 */
	cleanup() {
		const now = Date.now()
		let cleaned = 0

		for (const [key, item] of this.cache.entries()) {
			if (now > item.expiresAt) {
				this.cache.delete(key)
				cleaned++
			}
		}

		if (cleaned > 0) {
			logger.info(`已清理${cleaned}项过期缓存`)
		}

		return cleaned
	}

	/**
	 * 获取缓存统计信息
	 */
	stats() {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys()),
		}
	}
}

/**
 * 文件缓存类
 */
class FileCache {
	constructor(cacheDir = '.cache') {
		this.cacheDir = cacheDir
		this.ensureCacheDir()
	}

	/**
	 * 确保缓存目录存在
	 */
	ensureCacheDir() {
		if (!fs.existsSync(this.cacheDir)) {
			fs.mkdirSync(this.cacheDir, { recursive: true })
			logger.debug(`缓存目录已创建: ${this.cacheDir}`)
		}
	}

	/**
	 * 生成缓存文件路径
	 * @param {string} key - 缓存键
	 */
	getCacheFilePath(key) {
		const hash = crypto.createHash('md5').update(key).digest('hex')
		return path.join(this.cacheDir, `${hash}.json`)
	}

	/**
	 * 设置缓存
	 * @param {string} key - 缓存键
	 * @param {any} value - 缓存值
	 * @param {number} ttl - 过期时间（毫秒），默认1小时
	 */
	async set(key, value, ttl = 3600000) {
		try {
			const filePath = this.getCacheFilePath(key)
			const data = {
				key,
				value,
				expiresAt: Date.now() + ttl,
			}

			await fs.promises.writeFile(filePath, JSON.stringify(data), 'utf8')
			logger.debug(`文件缓存已设置: ${key}`)
		} catch (error) {
			logger.error(`设置文件缓存失败: ${error.message}`)
		}
	}

	/**
	 * 获取缓存
	 * @param {string} key - 缓存键
	 * @returns {Promise<any|null>} - 缓存值
	 */
	async get(key) {
		try {
			const filePath = this.getCacheFilePath(key)

			if (!fs.existsSync(filePath)) {
				logger.debug(`文件缓存未命中: ${key}`)
				return null
			}

			const content = await fs.promises.readFile(filePath, 'utf8')
			const data = JSON.parse(content)

			if (Date.now() > data.expiresAt) {
				logger.debug(`文件缓存已过期: ${key}`)
				await fs.promises.unlink(filePath)
				return null
			}

			logger.debug(`文件缓存命中: ${key}`)
			return data.value
		} catch (error) {
			logger.error(`读取文件缓存失败: ${error.message}`)
			return null
		}
	}

	/**
	 * 删除缓存
	 * @param {string} key - 缓存键
	 */
	async delete(key) {
		try {
			const filePath = this.getCacheFilePath(key)
			if (fs.existsSync(filePath)) {
				await fs.promises.unlink(filePath)
				logger.debug(`文件缓存已删除: ${key}`)
				return true
			}
			return false
		} catch (error) {
			logger.error(`删除文件缓存失败: ${error.message}`)
			return false
		}
	}

	/**
	 * 清空所有缓存
	 */
	async clear() {
		try {
			const files = await fs.promises.readdir(this.cacheDir)
			let cleared = 0

			for (const file of files) {
				if (file.endsWith('.json')) {
					await fs.promises.unlink(path.join(this.cacheDir, file))
					cleared++
				}
			}

			logger.info(`已清空所有文件缓存，共${cleared}项`)
			return cleared
		} catch (error) {
			logger.error(`清空文件缓存失败: ${error.message}`)
			return 0
		}
	}
}

// 创建默认的内存缓存实例
export const memoryCache = new MemoryCache()

// 创建默认的文件缓存实例
export const fileCache = new FileCache('.cache')

// 定期清理过期的内存缓存（每30分钟）
setInterval(() => {
	memoryCache.cleanup()
}, 30 * 60 * 1000)

/**
 * 缓存装饰器工厂函数
 * @param {Object} options - 配置选项
 * @param {string} options.keyPrefix - 缓存键前缀
 * @param {number} options.ttl - 过期时间（毫秒）
 * @param {boolean} options.useFileCache - 是否使用文件缓存
 * @returns {Function} - 装饰器函数
 */
export function cacheable(options = {}) {
	const { keyPrefix = '', ttl = 3600000, useFileCache = false } = options
	const cache = useFileCache ? fileCache : memoryCache

	return function (target, propertyKey, descriptor) {
		const originalMethod = descriptor.value

		descriptor.value = async function (...args) {
			// 生成缓存键
			const cacheKey = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`

			// 尝试从缓存获取
			const cached = await cache.get(cacheKey)
			if (cached !== null) {
				return cached
			}

			// 执行原方法
			const result = await originalMethod.apply(this, args)

			// 存入缓存
			await cache.set(cacheKey, result, ttl)

			return result
		}

		return descriptor
	}
}

export default {
	memoryCache,
	fileCache,
	cacheable,
	MemoryCache,
	FileCache,
}
