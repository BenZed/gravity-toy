module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            diagnostics: false
        }
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsConfig: './tsconfig.test.json' }]
    },
    moduleFileExtensions: ['js', 'ts', 'tsx'],
}
