/**
 * 日志工具模块
 * 提供统一的日志输出接口
 */

const LOG_LEVELS = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3,
}

// 从环境变量读取日志级别，默认为 INFO
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO

/**
 * 格式化时间戳
 */
function getTimestamp() {
	return new Date().toISOString()
}

/**
 * 错误日志
 */
export function error(message, ...args) {
	if (currentLevel >= LOG_LEVELS.ERROR) {
		console.error(`[${getTimestamp()}] ❌ ERROR:`, message, ...args)
	}
}

/**
 * 警告日志
 */
export function warn(message, ...args) {
	if (currentLevel >= LOG_LEVELS.WARN) {
		console.warn(`[${getTimestamp()}] ⚠️  WARN:`, message, ...args)
	}
}

/**
 * 信息日志
 */
export function info(message, ...args) {
	if (currentLevel >= LOG_LEVELS.INFO) {
		console.log(`[${getTimestamp()}] ℹ️  INFO:`, message, ...args)
	}
}

/**
 * 调试日志
 */
export function debug(message, ...args) {
	if (currentLevel >= LOG_LEVELS.DEBUG) {
		console.log(`[${getTimestamp()}] 🔍 DEBUG:`, message, ...args)
	}
}

/**
 * 成功日志
 */
export function success(message, ...args) {
	if (currentLevel >= LOG_LEVELS.INFO) {
		console.log(`[${getTimestamp()}] ✅ SUCCESS:`, message, ...args)
	}
}

export default {
	error,
	warn,
	info,
	debug,
	success,
}
