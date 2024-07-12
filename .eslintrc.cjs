module.exports = {
  extends: [
    // 避免和prettier冲突
    'prettier',
  ],

  plugins: [
    // 基础ts支持
    '@typescript-eslint',
    // 检查没有使用的引入, 并可以自动修复
    'unused-imports',
    // 排序类属性
    'sort-class-members',
  ],
  parser: '@typescript-eslint/parser',

  // 忽略文件夹
  ignorePatterns: ['node_modules', 'dist', 'coverage'],

  // 指定ts项目
  root: true,
  parserOptions: { project: true },

  // 规则
  overrides: [
    {
      files: ['src/**/*.ts', 'src/**/*.tsx', 'test/**/*.ts', 'test/**/*.tsx'],
      rules: {
        // 检查无意义的比较
        '@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],

        // 拒绝浮动promise
        '@typescript-eslint/no-floating-promises': 'error',

        // 必须标注函数返回类型
        '@typescript-eslint/explicit-function-return-type': ['error', {}],

        // 检查没有使用的变量
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
          },
        ],

        // 检查没有使用的引入, 并自动修复
        'unused-imports/no-unused-imports': 'error',

        // 排序类属性
        'sort-class-members/sort-class-members': [
          2,
          {
            order: [
              '[static-properties]',
              '[static-methods]',
              '[properties]',
              '[conventional-private-properties]',
              'constructor',
              '[methods]',
              '[conventional-private-methods]',
            ],
            accessorPairPositioning: 'getThenSet',
          },
        ],
      },
    },
  ],
}
