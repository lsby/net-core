# Net-Core

一个基于 TypeScript 的强类型后端框架

> **代码即文档**: 本框架不提供冗长的文字文档, 所有用法均通过代码示例与类型定义呈现

## 特点

- 类型安全: 深度使用 TypeScript 的类型系统, 尽可能实现类型安全, 绝大多数错误都可以在编译时发现
- 接口分层设计: 严格区分 插件(参数解析), 接口逻辑(业务处理), 转换器(结果包装), 返回器(协议响应), 确保每一层职责单一且高度可测试
- 内置 WebSocket 能力: 核心逻辑与传输层解耦, 支持通过一套代码同时暴露 HTTP 接口与 WebSocket 订阅点, 实现逻辑的最大化复用
- 接口逻辑可以被内部调用: 接口逻辑作为独立的一等公民, 支持在代码内部直接调用, 无需经过网络协议栈, 便于实现复杂的内部服务调用
- 允许接口逻辑组合: 提供组合能力, 支持将多个原子逻辑单元串联成复杂的业务流, 并保持全链路的类型安全
- 类型生成: 提供自动化工具, 静态分析代码, 生成接口的类型文件, 接口信息永远同步

## 代码结构

本仓库是一个 monorepo 包:

- core包: 框架的本体实现
- example开头的包: 示例, 请按前缀数字阅读

## 快速开始

参考以下示例包, 按顺序阅读代码注释即可:

- 基础用法与核心概念: [1-example-base](./packages/1-example-base)
- 如何扩展插件: [2-example-plugins](./packages/2-example-plugins)
- 业务逻辑的组合与复用: [3-example-logic-composition](./packages/3-example-logic-composition)

## 自动化工具链

框架内置了一些命令行工具:

- lsby-net-core-gen-api-list: 从代码生成接口索引
- lsby-net-core-gen-api-type: 从代码生成接口类型
- lsby-net-core-gen-test: 从代码生成单元测试

在不同的示例中, 会将这些命令编写为 npm 命令, 请查看示例中的 package.json 来了解详情
