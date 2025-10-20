#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import schema from './src/schema/index.js'
import tools from './src/func-tools/index.js'

// 创建McpServer实例
const server = new McpServer({
	name: 'yapi-mcp-server',
	version: '0.0.1',
})

// 注册YApi相关工具
// 读取配置文件工具
server.tool('read_config', schema.readConfig, async (params) => {
	return await tools.readConfig(params)
})

// 获取YApi数据工具
server.tool('get_yapi_data', schema.getYApiData, async (params) => {
	return await tools.getYApiData(params)
})

// 生成TypeScript类型定义工具
server.tool('generate_types', schema.generateTypes, async (params) => {
	return await tools.generateTypes(params)
})

// 生成Mock数据工具
server.tool('generate_mock_from_yapi', schema.generateMockFromYApi, async (params) => {
	return await tools.generateMockFromYApi(params)
})

// 生成API请求代码工具
server.tool('generate_api_code', schema.generateApiCode, async (params) => {
	return await tools.generateApiCode(params)
})

// 主函数
async function main() {
	try {
		// 仅支持stdio模式 (通过标准输入输出与MCP客户端通信)
		console.error('启动YApi MCP服务器 - stdio模式')
		const transport = new StdioServerTransport()
		await server.connect(transport)
	} catch (error) {
		console.error('启动服务器时出错:', error)
		process.exit(1)
	}
}

// 启动服务器
main()
