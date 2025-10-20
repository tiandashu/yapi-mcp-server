import { builtinModules } from 'module'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

export default {
	input: 'src/server.js',
	output: {
		dir: 'dist',
		format: 'es',
		// 保留模块结构
		preserveModules: true,
		preserveModulesRoot: 'src',
	},
	// 外部化依赖
	external: [
		// NPM 依赖包
		/@modelcontextprotocol\/.*/,
		'axios',
		'zod',
		// Node.js 内置模块
		...builtinModules,
		...builtinModules.map((m) => `node:${m}`),
	],
	plugins: [
		// 解析 node_modules 中的模块
		resolve({
			preferBuiltins: true,
		}),
		// 转换 CommonJS 模块为 ES6
		commonjs(),
		// 代码压缩和混淆
		terser({
			compress: {
				// 删除 console 语句（可选，保留 console.error 用于错误输出）
				pure_funcs: [],
				// 删除未使用的代码
				dead_code: true,
				// 压缩布尔值
				booleans: true,
				// 优化条件语句
				conditionals: true,
			},
			mangle: {
				// 混淆变量名（不混淆顶层变量名以保持导出可用）
				toplevel: false,
				// 保留类名（如果需要）
				keep_classnames: false,
				// 保留函数名（如果需要）
				keep_fnames: false,
			},
			format: {
				// 删除注释，但保留 shebang (#!)
				comments: /^#!/,
			},
		}),
	],
}
