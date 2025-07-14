import fs from 'fs'
import path from 'path'

/**
 * 查找并读取用户项目中的yapi.config.json配置文件
 * @param {string} projectPath - 项目路径，如果不提供则使用当前工作目录
 * @returns {Promise<Object>} - 返回配置对象
 */
async function findYApiConfig(projectPath) {
	// 如果没有提供项目路径，使用当前工作目录
	const searchPath = projectPath || process.cwd()
	const configFileName = 'yapi.config.json'

	let currentPath = path.resolve(searchPath)

	// 向上查找配置文件，直到找到或到达根目录
	while (currentPath !== path.dirname(currentPath)) {
		const configFilePath = path.join(currentPath, configFileName)

		try {
			// 检查配置文件是否存在
			await fs.promises.access(configFilePath, fs.constants.F_OK)

			// 读取配置文件内容
			const configContent = await fs.promises.readFile(configFilePath, 'utf8')
			const config = JSON.parse(configContent)

			console.log(`找到配置文件: ${configFilePath}`)

			// 验证配置文件必要字段
			if (!config.remoteUrl) {
				throw new Error('配置文件中缺少remoteUrl字段')
			}

			// 设置默认值
			config.dataKey = config.dataKey || 'data'
			config.type = config.type || 'yapi'

			// 设置文件路径默认值
			config.mockPath = config.mockPath || 'src/mocks'
			config.typePath = config.typePath || 'src/types'
			config.apiPath = config.apiPath || 'src/api'

			return {
				config,
				configPath: configFilePath,
				projectPath: currentPath,
			}
		} catch (error) {
			if (error.code !== 'ENOENT') {
				// 如果是文件存在但读取失败的其他错误，抛出异常
				throw new Error(`读取配置文件失败: ${error.message}`)
			}
		}

		// 向上查找一层目录
		currentPath = path.dirname(currentPath)
	}

	throw new Error(`未找到${configFileName}配置文件，请确保在项目根目录下创建该文件`)
}

/**
 * 读取YApi配置文件的MCP工具函数
 */
export const readConfig = async (params) => {
	try {
		const { projectPath } = params
		const result = await findYApiConfig(projectPath)

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: true,
							message: '成功读取配置文件',
							data: {
								config: result.config,
								configPath: result.configPath,
								projectPath: result.projectPath,
							},
						},
						null,
						2
					),
				},
			],
		}
	} catch (error) {
		console.error('读取配置文件错误:', error.message)
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: false,
							message: `读取配置文件失败: ${error.message}`,
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
