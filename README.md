# Net-Core

一个基于 TypeScript 的强类型后端框架

> **代码即文档**: 本框架不提供文字文档, 所有用法均通过代码示例与类型定义呈现

## 核心特性

**极致的类型安全与纯函数设计**

- TypeScript 类型系统全覆盖: 从 HTTP 请求到业务逻辑再到客户端, 完整的类型链路, 编译时发现绝大多数错误
- 副作用隔离: 插件负责副作用操作, 业务逻辑保持纯函数, 极大提升可测试性和可维护性

**灵活的逻辑复用架构**

- 一套代码, 多种使用方式: 同一份业务逻辑既可作为 HTTP 接口, 也可作为纯函数被其他模块调用
- 代数效应链式组合: 支持将通用能力(如鉴权、缓存、限流)按 Monad 模式堆叠, 实现跨项目零成本复用

**统一的网络能力**

- HTTP 与 WebSocket 无缝融合: WebSocket 作为一类特殊的插件存在, 与 HTTP 接口共用业务逻辑层, 复用已有代码
- 多协议统一管道: 同一个业务逻辑可同时服务多个网络接口

**开发效率工具链**

- 自动化代码生成: API 索引、TypeScript 定义、单元测试框架自动生成, 文档与代码永不失同步
- 代码即文档哲学: 通过严密的类型定义和示例代码呈现所有用法

## 代码结构

本仓库是一个 monorepo 包:

- core包: 框架的本体实现
- example开头的包: 示例, 请按前缀数字阅读

## 快速开始

先编译核心包:

```base
cd packages/core
pnpm i
npm run _build:all
```

然后依次尝试以下示例包, 每个包都可以独立运行:

- 核心概念与基本用法: [1-example-base](./packages/1-example-base)
- 内置插件和自定义插件: [2-example-plugins](./packages/2-example-plugins), 所有内置插件见[源码](./packages/core/src/plugin)
- 业务逻辑的组合与复用: [3-example-logic-composition](./packages/3-example-logic-composition)
- ws机制: [4-example-web-socket](./packages/4-example-web-socket)
- 测试机制: [5-example-test](./packages/5-example-test)

更多示例和实际应用, 可以参考我的[个人模板项目](https://github.com/lsby/playground-ts-service)

## 自动化工具链

框架内置了一些命令行工具:

- lsby-net-core-gen-api-list: 从代码生成接口索引
- lsby-net-core-gen-api-type: 从代码生成接口类型
- lsby-net-core-gen-test: 从代码生成单元测试

在不同的示例中, 会将这些命令编写为 npm 命令, 请查看示例中的 package.json 来了解详情
