import { z } from 'zod'

// 读取配置文件
export const readConfigSchema = {
	projectPath: z.string().optional().describe('项目路径，如果不提供则使用当前工作目录'),
}

// 获取YApi数据
export const getYApiDataSchema = {
	remoteUrl: z.string().describe('YApi导出接口URL'),
	interfacePath: z.string().optional().describe('指定接口路径'),
	method: z.string().optional().describe('请求方法'),
	listAll: z.boolean().optional().describe('是否列出所有接口'),
	forceRefresh: z.boolean().optional().describe('是否强制刷新缓存，默认false'),
}

// 生成TypeScript类型定义
export const generateTypesSchema = {
	resBodySchema: z.string().describe('接口响应的JSON Schema字符串'),
	dataKey: z.string().optional().describe('数据字段名，默认为data'),
	interfaceName: z.string().optional().describe('接口名称'),
	path: z.string().optional().describe('接口路径'),
	method: z.string().optional().describe('请求方法'),
	title: z.string().optional().describe('接口标题'),
}

// 生成Mock数据
export const generateMockFromYApiSchema = {
	resBodySchema: z.string().describe('接口响应的JSON Schema字符串'),
	dataKey: z.string().optional().describe('数据字段名，默认为data'),
	mockType: z.string().optional().describe('Mock类型: full-完整响应, data-only-仅数据部分'),
	title: z.string().optional().describe('接口标题'),
	path: z.string().optional().describe('接口路径'),
	method: z.string().optional().describe('请求方法'),
}

// 生成API请求代码
export const generateApiCodeSchema = {
	path: z.string().describe('接口路径'),
	method: z.string().optional().describe('请求方法，默认GET'),
	title: z.string().optional().describe('接口标题'),
	reqParams: z.array(z.any()).optional().describe('路径参数数组'),
	reqQuery: z.array(z.any()).optional().describe('查询参数数组'),
	interfaceName: z.string().optional().describe('接口类型名称'),
	requestLib: z.string().optional().describe('请求库类型: axios | fetch，默认axios'),
}

export default {
	readConfig: readConfigSchema,
	getYApiData: getYApiDataSchema,
	generateTypes: generateTypesSchema,
	generateMockFromYApi: generateMockFromYApiSchema,
	generateApiCode: generateApiCodeSchema,
}
