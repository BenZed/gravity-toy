/* eslint-env node */

module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier'
    ],
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'eslint-plugin-react',
        'eslint-plugin-react-hooks',
        'prettier'
    ],
    root: true,
    rules: {
        'prettier/prettier': 'error',
        '@typescript-eslint/restrict-plus-operands': 'off', // this rule seems to frequently break
        '@typescript-eslint/no-unused-expressions': [
            'error',
            { allowTaggedTemplates: true }
        ],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { args: 'all', argsIgnorePattern: '^_' }
        ],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/unified-signatures': 'off',
        '@typescript-eslint/no-duplicate-imports': 'error',
        '@typescript-eslint/no-this-alias': 'off', // I don't have a problem with 'this' aliasing.
        '@typescript-eslint/explicit-member-accessibility': [
            'error',
            { accessibility: 'no-public' }
        ],
        '@typescript-eslint/explicit-function-return-type': [
            'off',
            { allowExpressions: true }
        ]
    }
}
