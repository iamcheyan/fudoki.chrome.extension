const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        content: './src/content.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'chrome-extension'),
        clean: true,
    },
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify"),
            "fs": false
        }
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'src/manifest.json', to: '.' },
                { from: 'src/popup.html', to: '.' },
                { from: 'src/popup.js', to: '.' },
                { from: 'src/style.css', to: '.' },
                { from: 'src/content.css', to: '.' },
                { from: 'src/background.js', to: '.' },
                { from: 'src/settings.html', to: '.' },
                { from: 'src/settings.js', to: '.' },
                { from: 'src/icons', to: 'icons' },
                { from: 'node_modules/kuromoji/dict', to: 'dict' }
            ],
        }),
    ],
};
