import fs from 'fs'
import path from 'path'
import { readConfig } from '../read-config/index.js'
import { getYApiData } from '../get-yapi-data/index.js'
import { generateTypes } from '../generate-types/index.js'
import { generateMockFromYApi } from '../generate-mock-from-yapi/index.js'
import { generateApiCode } from '../generate-api-code/index.js'

/**
 * YApi完整工作流程
 * 从配置读取到数据生成的一键式解决方案
 */
export const yapiWorkflow = async (params) => {
	const results = {
		config: null,
		interfaces: [],
		types: null,
		mockData: null,
		apiCode: null,
		errors: [],
	}

	try {
		const {
			projectPath,
			interfacePath,
			method,
			generateMock = true,
			generateType = true,
			generateApi = false,
			mockType = 'full',
			requestLib = 'axios',
		} = params

		// 步骤1: 读取配置文件
		console.log('步骤1: 读取配置文件...')
		const configResult = await readConfig({ projectPath })
		const configData = JSON.parse(configResult.content[0].text)

		if (!configData.success) {
			throw new Error(`读取配置文件失败: ${configData.message}`)
		}

		results.config = configData.data.config
		console.log(`✅ 配置文件读取成功: ${configData.data.configPath}`)

		// 步骤2: 获取YApi数据
		console.log('步骤2: 获取YApi接口数据...')
		const yapiResult = await getYApiData({
			remoteUrl: results.config.remoteUrl,
			interfacePath,
			method,
			listAll: !interfacePath,
		})

		const yapiData = JSON.parse(yapiResult.content[0].text)
		if (!yapiData.success) {
			throw new Error(`获取YApi数据失败: ${yapiData.message}`)
		}

		if (interfacePath && method) {
			// 单个接口处理
			const apiInterface = yapiData.data
			results.interfaces = [apiInterface]
			console.log(`✅ 获取接口数据成功: ${method.toUpperCase()} ${interfacePath}`)

			// 步骤3: 生成TypeScript类型定义
			if (generateType && apiInterface.res_body) {
				console.log('步骤3: 生成TypeScript类型定义...')
				const typeResult = await generateTypes({
					resBodySchema: apiInterface.res_body,
					dataKey: results.config.dataKey,
					path: apiInterface.path,
					method: apiInterface.method,
					title: apiInterface.title,
				})

				const typeData = JSON.parse(typeResult.content[0].text)
				if (typeData.success) {
					results.types = typeData.data
					console.log(`✅ TypeScript类型定义生成成功: ${typeData.data.interfaceName}`)
				} else {
					results.errors.push(`生成类型定义失败: ${typeData.message}`)
				}
			}

			// 步骤4: 生成Mock数据
			if (generateMock && apiInterface.res_body) {
				console.log('步骤4: 生成Mock数据...')
				const mockResult = await generateMockFromYApi({
					resBodySchema: apiInterface.res_body,
					dataKey: results.config.dataKey,
					mockType,
					title: apiInterface.title,
					path: apiInterface.path,
					method: apiInterface.method,
				})

				const mockData = JSON.parse(mockResult.content[0].text)
				if (mockData.success) {
					results.mockData = mockData.data
					console.log(`✅ Mock数据生成成功`)
				} else {
					results.errors.push(`生成Mock数据失败: ${mockData.message}`)
				}
			}

			// 步骤5: 生成API请求代码
			if (generateApi) {
				console.log('步骤5: 生成API请求代码...')
				const apiResult = await generateApiCode({
					path: apiInterface.path,
					method: apiInterface.method,
					title: apiInterface.title,
					reqParams: apiInterface.req_params || [],
					reqQuery: apiInterface.req_query || [],
					interfaceName: results.types?.interfaceName,
					requestLib,
				})

				const apiData = JSON.parse(apiResult.content[0].text)
				if (apiData.success) {
					results.apiCode = apiData.data
					console.log(`✅ API请求代码生成成功: ${apiData.data.functionName}`)
				} else {
					results.errors.push(`生成API代码失败: ${apiData.message}`)
				}
			}
		} else {
			// 列出所有接口
			results.interfaces = yapiData.data.interfaces || yapiData.data
			console.log(`✅ 获取接口列表成功，共${results.interfaces.length}个接口`)
		}

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: true,
							message: 'YApi工作流程执行完成',
							data: results,
						},
						null,
						2
					),
				},
			],
		}
	} catch (error) {
		console.error('YApi工作流程执行错误:', error.message)
		results.errors.push(error.message)

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: false,
							message: `YApi工作流程执行失败: ${error.message}`,
							data: results,
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
 * 保存生成的文件到本地
 */
export const saveYApiFiles = async (params) => {
	try {
		const { projectPath, types, mockData, apiCode, config, filename } = params

		if (!types && !mockData && !apiCode) {
			throw new Error('没有要保存的数据')
		}

		// 确定项目根目录
		const rootPath = projectPath || process.cwd()
		const savedFiles = []

		// 从配置中获取路径，如果没有配置则使用默认值
		const typeOutputPath = config?.typePath || 'src/types'
		const mockOutputPath = config?.mockPath || 'src/mocks'
		const apiOutputPath = config?.apiPath || 'src/api'

		// 保存类型定义文件
		if (types) {
			const typePath = path.join(rootPath, typeOutputPath)
			await fs.promises.mkdir(typePath, { recursive: true })

			const typeFileName = filename ? `${filename}.d.ts` : 'api-types.d.ts'
			const typeFilePath = path.join(typePath, typeFileName)
			await fs.promises.writeFile(typeFilePath, types.typeDefinition, 'utf8')
			savedFiles.push(typeFilePath)
			console.log(`✅ TypeScript类型定义已保存: ${typeFilePath}`)
		}

		// 保存Mock数据文件
		if (mockData) {
			const mockPath = path.join(rootPath, mockOutputPath)
			await fs.promises.mkdir(mockPath, { recursive: true })

			const mockFileName = filename ? `${filename}.mock.json` : 'api-mock.json'
			const mockFilePath = path.join(mockPath, mockFileName)
			await fs.promises.writeFile(mockFilePath, mockData.jsonString, 'utf8')
			savedFiles.push(mockFilePath)
			console.log(`✅ Mock数据已保存: ${mockFilePath}`)
		}

		// 保存API请求代码文件
		if (apiCode) {
			const apiPath = path.join(rootPath, apiOutputPath)
			await fs.promises.mkdir(apiPath, { recursive: true })

			const apiFileName = filename ? `${filename}.ts` : 'api-requests.ts'
			const apiFilePath = path.join(apiPath, apiFileName)
			await fs.promises.writeFile(apiFilePath, apiCode.apiCode, 'utf8')
			savedFiles.push(apiFilePath)
			console.log(`✅ API请求代码已保存: ${apiFilePath}`)
		}

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: true,
							message: '文件保存成功',
							data: {
								savedFiles,
								paths: {
									typeOutput: config?.typePath || 'src/types',
									mockOutput: config?.mockPath || 'src/mocks',
									apiOutput: config?.apiPath || 'src/api',
								},
							},
						},
						null,
						2
					),
				},
			],
		}
	} catch (error) {
		console.error('保存文件错误:', error.message)
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						{
							success: false,
							message: `保存文件失败: ${error.message}`,
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
