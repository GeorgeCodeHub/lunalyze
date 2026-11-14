import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist', 'spike', '.claude']), // .claude: locally installed agent tools, not app code
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  {
    languageOptions: { globals: globals.browser },
    rules: {
      // AGENTS.md: arrow-function consts everywhere, never `function` declarations.
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
    },
  },
  { files: ['backend/scripts/**', '*.config.*'], languageOptions: { globals: globals.node } },
);
