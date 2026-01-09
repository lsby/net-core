# Net-Core

一个基于 TypeScript 的**强类型**、**函数式**后端框架。

> **代码即文档**: 本框架不提供文字文档，精确的类型定义和自解释的代码才是最好的说明书。

## 🎯 核心特性

- **🛡️ 极致的类型安全**: 深度集成 Zod。从请求参数(Params/Body/Query)到响应结果，全程享受 TypeScript 自动推导的类型保护，彻底消除 "Type Lie"。
- **🧩 模块化架构**: 将后端逻辑严格拆分为 **插件(Plugin)**、**业务逻辑(Logic)** 和 **返回器(Returner)**。结构清晰，职责单一，拒绝大面条代码。
- **🔍 无隐式上下文**: 告别传统中间件 "偷偷挂载属性" 的黑盒魔法。插件产生的数据必须通过类型明确传递，数据来源一目了然。
- **λ 函数式编程体验**: 采用 `Either` 模式处理错误，强制显式处理异常分支。支持类 Monad 的逻辑组合(`.绑定()`)，让复杂业务像搭积木一样简单且健壮。
- **🤖 自动化工程**: 内置 CLI 工具链，自动生成 API 索引、Swagger 风格的类型定义、以及单元测试脚手架，告别繁琐的样板代码。
- **🧪 测试优先**: 业务逻辑与 HTTP 传输层解耦，支持 Co-location 测试策略。提供标准化的测试工具，只需关注"输入"与"预期"，极大降低测试成本。
- **📦 逻辑可移植**: 业务逻辑是纯粹的计算单元，不绑定特定 Web 框架对象（如 express req/res），这意味着核心逻辑可以轻松移植或在不同场景复用。

## 📂 代码结构

本仓库采用 Monorepo 结构：

### 核心库

- **[core](./packages/core)**: 框架的本体实现，包含了服务器、插件系统、逻辑运行时及自动化工具。

### 学习路径

请按顺序阅读以下示例，逐步掌握框架使用：

1.  **[01-example-base](./packages/01-example-base)**: 核心概念入门。学习如何定义一个最基本的接口，理解“插件”、“逻辑”、“返回器”的协作。
2.  **[02-example-plugins](./packages/02-example-plugins)**: 插件系统详解。学习如何使用内置插件（如 JSON解析）以及如何编写自定义插件。
3.  **[03-example-logic-composition](./packages/03-example-logic-composition)**: 进阶业务编排。学习如何复用逻辑单元，使用 `.绑定()` 串联复杂的业务流程。
4.  **[04-example-web-socket](./packages/04-example-web-socket)**: WebSocket 机制示例。
5.  **[05-example-test](./packages/05-example-test)**: 单元测试机制。学习如何使用框架提供的工具进行高效测试。
6.  **[06-example-complex-type-export](./packages/06-example-complex-type-export)**: 复杂类型系统的导出方法。

## 🚀 快速开始

### 1. 环境准备

确保已安装 `pnpm`。

### 2. 编译核心

在使用示例前，需要先构建核心库：

```bash
cd packages/core
pnpm i
npm run _build:all
```

### 3. 运行示例

进入任意示例目录（例如 `packages/01-example-base`），运行开发命令：

```bash
cd packages/01-example-base
pnpm dev
# 你的接口现在运行在 http://localhost:3000
```

## 🏗️ 生产级实战

**如果你想看如何在生产环境中使用本框架, 构建大型应用（包含 全局状态, 数据库集成, 文件上传, JWT 鉴权, WebSocket 机制应用, CRUD 组合器 等）, 请参考作者的完全体项目模版:**

👉 **[lsby/playground-ts-service](https://github.com/lsby/playground-ts-service)**

## 🛠️ 自动化工具链

框架由以下内置 CLI 工具驱动效率：

- `lsby-net-core-gen-api-list`: 自动扫描代码，生成 API 路由索引。
- `lsby-net-core-gen-api-type`: 自动扫描代码，生成前端可用的 TypeScript 类型定义。
- `lsby-net-core-gen-test`: 自动扫描代码，生成单元测试脚手架。

在不同的示例中, 会将这些命令编写为 npm 命令, 请查看示例中的 package.json 来了解详情
