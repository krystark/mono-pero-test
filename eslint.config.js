import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    settings: { react: { version: '18.3' } },
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
        parserOptions: {
            project: ["./tsconfig.json"],
        },
    },
    plugins: {
      react
    },
    rules: {
        ...react.configs.recommended.rules,
        ...react.configs['jsx-runtime'].rules,
        "semi": ["error", "always"],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "react/display-name": 'off',
    },
  },
)
