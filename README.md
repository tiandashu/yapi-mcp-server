# YApi MCP Server

这是一个 Model Context Protocol (MCP) 服务器，用于与 YApi 接口管理平台集成，支持自动生成 TypeScript 类型定义、Mock 数据和 API 请求代码。

## 功能特性

### 🔧 核心功能

- **配置文件读取**: 自动读取项目中的 `yapi.config.json` 配置文件
- **YApi 数据获取**: 通过配置的 remoteUrl 获取 YApi 项目的完整接口信息
- **TypeScript 类型生成**: 根据接口响应 Schema 自动生成 TypeScript interface 定义
- **Mock 数据生成**: 智能生成符合接口结构的 Mock 测试数据
- **API 请求代码生成**: 自动生成 Axios 或 Fetch 风格的 API 请求函数
- **完整工作流**: 提供一键式从配置到生成的完整解决方案
- **灵活的文件路径配置**: 支持自定义输出目录

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 YApi

在您的前端项目根目录下创建 `yapi.config.json` 文件：

```json
{
	"remoteUrl": "https://your-yapi-domain.com/api/open/plugin/export-full?type=json&pid=1437&status=all&token=your-token",
	"type": "yapi",
	"dataKey": "data",
	"mockPath": "src/mocks",
	"typePath": "src/types",
	"apiPath": "src/api"
}
```

### 3. 启动服务

```bash
# 开发模式
node server.js

# 或者使用npm命令
npm start
```

## 主要工具

### 🎯 YApi 工作流工具 (推荐)

```javascript
yapi_workflow({
	projectPath: '/path/to/your/project', // 可选
	interfacePath: '/api/user/info', // 指定接口路径
	method: 'GET', // 请求方法
	generateMock: true, // 是否生成Mock数据
	generateType: true, // 是否生成TypeScript类型
	generateApi: true, // 是否生成API请求代码
	mockType: 'full', // Mock类型：full | data-only
	requestLib: 'axios', // 请求库：axios | fetch
})
```

### 📝 单独功能工具

#### 读取配置文件

```javascript
read_config({ projectPath: '/path/to/project' })
```

#### 获取 YApi 数据

```javascript
get_yapi_data({
	remoteUrl: 'https://your-yapi-url...',
	interfacePath: '/api/user/info',
	method: 'GET',
})
```

#### 生成 TypeScript 类型

```javascript
generate_types({
	resBodySchema: 'JSON Schema字符串',
	dataKey: 'data',
	interfaceName: 'UserInfo',
})
```

#### 生成 Mock 数据

```javascript
generate_mock_from_yapi({
	resBodySchema: 'JSON Schema字符串',
	dataKey: 'data',
	mockType: 'full',
})
```

#### 生成 API 请求代码

```javascript
generate_api_code({
	path: '/api/user/info',
	method: 'GET',
	title: '用户信息接口',
	reqParams: [], // 路径参数
	reqQuery: [], // 查询参数
	interfaceName: 'UserInfoData',
	requestLib: 'axios', // 或 'fetch'
})
```

#### 保存生成的文件

```javascript
save_yapi_files({
	projectPath: '/path/to/project',
	types: {
		/* 类型数据 */
	},
	mockData: {
		/* Mock数据 */
	},
	apiCode: {
		/* API代码数据 */
	},
	config: {
		/* 配置对象 */
	},
	filename: 'user-api',
})
```

## 配置文件说明

### 必填字段

- `remoteUrl`: YApi 项目导出接口 URL
- `type`: 平台类型，固定为 "yapi"

### 可选字段

- `dataKey`: 响应数据字段名，默认 "data"
- `mockPath`: Mock 文件输出路径，默认 "src/mocks"
- `typePath`: 类型文件输出路径，默认 "src/types"
- `apiPath`: API 代码输出路径，默认 "src/api"

## 生成的文件示例

### TypeScript 类型定义

```typescript
/** 用户信息接口 */
export interface UserInfoData {
	/** 用户ID */
	userId: number
	/** 用户名 */
	username: string
	/** 邮箱 */
	email: string
}
```

### API 请求代码 (Axios)

```typescript
/**
 * 用户信息接口
 */
export const getUserInfo = async (): Promise<UserInfoData> => {
	const response = await axios.get('/api/user/info')
	return response.data
}
```

### Mock 数据

```json
{
	"code": "200",
	"success": true,
	"message": "操作成功",
	"data": {
		"userId": 12345,
		"username": "测试用户",
		"email": "test@example.com"
	}
}
```

## 技术栈

- **Node.js** - 运行环境
- **Model Context Protocol (MCP)** - 协议标准
- **ES6 Modules** - 模块系统
- **Axios** - HTTP 请求库
- **Zod** - 参数验证

## 特色功能

### 🎨 智能代码生成

- 根据接口路径和方法自动生成函数名
- 支持路径参数和查询参数的自动处理
- 生成带有完整 TypeScript 类型的代码

### 🔧 灵活配置

- 支持多种输出路径配置
- 支持 Axios 和 Fetch 两种请求方式
- 支持完整响应或仅数据部分的 Mock 生成

### 📁 项目结构友好

- 自动创建输出目录
- 支持自定义文件命名
- 符合前端项目常见目录结构

## 使用场景

1. **前端项目初始化**: 快速生成所有接口的类型定义和请求函数
2. **接口对接**: 为新接口快速生成相关代码文件
3. **Mock 开发**: 生成符合接口结构的测试数据
4. **类型安全**: 确保前端代码与后端接口的类型一致性

## 完整示例

```bash
# 1. 创建配置文件
echo '{
	"remoteUrl": "https://your-yapi.com/api/open/plugin/export-full?type=json&pid=123&status=all&token=xxx",
	"type": "yapi",
	"dataKey": "data",
	"mockPath": "src/mocks",
	"typePath": "src/types",
	"apiPath": "src/api"
}' > yapi.config.json

# 2. 启动MCP服务
node server.js

# 3. 使用工作流生成代码
yapi_workflow({
	interfacePath: '/api/user/profile',
	method: 'GET',
	generateMock: true,
	generateType: true,
	generateApi: true,
	requestLib: 'axios'
})
```

## 许可证

MIT License

## 支持与反馈

如有问题或建议，请通过 Issues 或内部渠道联系开发团队。
