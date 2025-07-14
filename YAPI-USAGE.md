# YApi MCP 服务使用说明

这个 MCP 服务可以帮助您从 YApi 接口平台自动生成 TypeScript 类型定义、Mock 数据和 API 请求代码。

## 配置文件

在项目根目录下创建 `yapi.config.json` 文件：

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

### 配置说明

- `remoteUrl`: YApi 项目的导出接口 URL
- `type`: 平台类型，固定为 "yapi"
- `dataKey`: 响应数据的字段名，通常为 "data" 或 "result"
- `mockPath`: Mock 数据文件的输出路径，默认为 "src/mocks"
- `typePath`: TypeScript 类型定义文件的输出路径，默认为 "src/types"
- `apiPath`: API 请求代码文件的输出路径，默认为 "src/api"

## 可用工具

### 1. 读取配置文件

```javascript
read_config({
	projectPath: '/path/to/your/project', // 可选，默认使用当前工作目录
})
```

### 2. 获取 YApi 数据

```javascript
get_yapi_data({
	remoteUrl: 'https://your-yapi-url...',
	interfacePath: '/api/user/info', // 可选，指定接口路径
	method: 'GET', // 可选，指定请求方法
	listAll: true, // 可选，是否列出所有接口
})
```

### 3. 生成 TypeScript 类型定义

```javascript
generate_types({
	resBodySchema: 'JSON Schema字符串',
	dataKey: 'data', // 可选，默认为 "data"
	interfaceName: 'UserInfo', // 可选，接口名称
	path: '/api/user/info', // 可选
	method: 'GET', // 可选
	title: '用户信息接口', // 可选
})
```

### 4. 生成 Mock 数据

```javascript
generate_mock_from_yapi({
	resBodySchema: 'JSON Schema字符串',
	dataKey: 'data', // 可选，默认为 "data"
	mockType: 'full', // 可选，"full" 或 "data-only"
	title: '用户信息接口', // 可选
	path: '/api/user/info', // 可选
	method: 'GET', // 可选
})
```

### 5. 生成 API 请求代码

```javascript
generate_api_code({
	path: '/api/user/info',
	method: 'GET', // 可选，默认为 "GET"
	title: '用户信息接口', // 可选
	reqParams: [], // 可选，路径参数数组
	reqQuery: [], // 可选，查询参数数组
	interfaceName: 'UserInfoData', // 可选，接口类型名称
	requestLib: 'axios', // 可选，"axios" 或 "fetch"，默认为 "axios"
})
```

### 6. 完整工作流 (推荐)

```javascript
yapi_workflow({
	projectPath: '/path/to/your/project', // 可选
	interfacePath: '/api/user/info', // 可选，指定接口
	method: 'GET', // 可选
	generateMock: true, // 可选，是否生成Mock
	generateType: true, // 可选，是否生成类型
	generateApi: false, // 可选，是否生成API代码
	mockType: 'full', // 可选，Mock类型
	requestLib: 'axios', // 可选，API请求库类型
})
```

### 7. 保存生成的文件

```javascript
save_yapi_files({
	projectPath: '/path/to/your/project', // 可选
	types: {
		/* 类型数据 */
	}, // 从工作流获取
	mockData: {
		/* Mock数据 */
	}, // 从工作流获取
	apiCode: {
		/* API代码数据 */
	}, // 从工作流获取
	config: {
		/* 配置对象 */
	}, // 从工作流获取
	filename: 'user-api', // 可选，文件名前缀
})
```

## 使用示例

### 示例 1：生成单个接口的类型、Mock 和 API 代码

```javascript
// 1. 使用完整工作流
yapi_workflow({
	interfacePath: '/api/user/info',
	method: 'GET',
	generateMock: true,
	generateType: true,
	generateApi: true,
	requestLib: 'axios',
})
```

### 示例 2：列出所有接口

```javascript
yapi_workflow({
	listAll: true,
})
```

### 示例 3：只生成类型定义

```javascript
yapi_workflow({
	interfacePath: '/api/user/info',
	method: 'GET',
	generateMock: false,
	generateType: true,
	generateApi: false,
})
```

### 示例 4：使用不同的请求库

```javascript
yapi_workflow({
	interfacePath: '/api/user/info',
	method: 'GET',
	generateApi: true,
	requestLib: 'fetch', // 使用 fetch 而不是 axios
})
```

## 生成的文件格式

### TypeScript 类型定义 (.d.ts)

```typescript
/** 用户信息接口 */
export interface UserInfoData {
	/** 用户ID */
	userId: number
	/** 用户名 */
	username: string
	/** 邮箱 */
	email: string
	/** 创建时间 */
	createTime: string
}
```

### Mock 数据 (.json)

```json
{
	"code": "200",
	"success": true,
	"message": "操作成功",
	"data": {
		"userId": 12345,
		"username": "测试用户",
		"email": "test@example.com",
		"createTime": "2025-01-01T00:00:00.000Z"
	}
}
```

### API 请求代码 (.ts)

#### Axios 版本

```typescript
/**
 * 用户信息接口
 */
export const getUserInfo = async (): Promise<UserInfoData> => {
	const response = await axios.get('/api/user/info')
	return response.data
}
```

#### Fetch 版本

```typescript
/**
 * 用户信息接口
 */
export const getUserInfo = async (): Promise<UserInfoData> => {
	const baseUrl = '/api/user/info'
	const url = baseUrl

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}

	return response.json()
}
```

### 文件保存位置

生成的文件会根据配置保存到指定目录：

- **类型定义**: `{typePath}/filename.d.ts` (默认: `src/types/api-types.d.ts`)
- **Mock 数据**: `{mockPath}/filename.mock.json` (默认: `src/mocks/api-mock.json`)
- **API 代码**: `{apiPath}/filename.ts` (默认: `src/api/api-requests.ts`)

## 注意事项

1. 确保 YApi 导出 URL 可以正常访问
2. 配置文件必须放在项目根目录或其父目录中
3. 生成的类型定义仅包含 dataKey 字段的结构
4. Mock 数据会根据字段名生成更贴切的测试数据
5. API 代码支持路径参数和查询参数的自动处理

## 常见问题

### Q: 找不到配置文件

A: 确保 `yapi.config.json` 在项目根目录或父目录中，与 `package.json` 同级

### Q: 无法获取 YApi 数据

A: 检查 `remoteUrl` 是否正确，网络是否可达

### Q: 生成的类型不正确

A: 检查 `dataKey` 配置是否与 API 响应结构匹配

### Q: Mock 数据不符合预期

A: 可以使用 `mockType: "data-only"` 只生成数据部分，或手动调整生成的 Mock 数据

### Q: API 代码生成错误

A: 检查接口参数配置是否正确，确保 `reqParams` 和 `reqQuery` 数据结构正确
