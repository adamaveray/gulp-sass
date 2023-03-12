import { makeEslintConfig, globals } from '@averay/codeformat';

export default [
  {
    ignores: ['coverage/**/*', 'dist/**/*'],
  },
  ...makeEslintConfig({ tsconfigPath: './tsconfig.json' }),
  {
    files: ['src/**/*', 'types/**/*'],
    languageOptions: {
      globals: { ...globals.node, NodeJS: 'readonly', BufferEncoding: 'readonly' },
    },
  },
  {
    files: ['test/**/*'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest, NodeJS: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
];
