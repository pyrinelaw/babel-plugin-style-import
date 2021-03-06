const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const fs= require("fs");
const util = require('../lib/util.js');

const styleImportOptions = {
    list: [
        {
            // 组件库名称
            name: 'antd',
            // 文件转换规则，默认为'_',
            // 传入 style 参数为 Function 类型时， splitChart 将不生效
            splitChart: '-',
            // 样式文件名，css/scss/less 均可
            // 最终导出为 {{name}}/{{style}}
            style: 'lib/{{name}}/style/index.less',
        },
        {
            // npm 组件库名称
            name: 'vant',
            // 文件转换规则，默认使用下划线
            splitChart: undefined,
            // 自定义样式文件名，css/scss/less 均可
            // 最终生成路径 {{name}}/{{style}}
            // 未返回路径时，将不会 导入样式文件
            style: function(name, libraryOptions) {
                const stylePath = `lib/vant-css/${util.convertName(name, '-')}.css`;
                const completeStylePath = path.resolve(__dirname, `./node_modules/vant/${stylePath}`);
                
                if (fs.existsSync(completeStylePath)) {
                    return stylePath;
                } else {
                    console.warn(`The file ${stylePath} is not exists！`);
                }
            },
        }
    ]
};

module.exports = {
    devServer: {
        open: true,
        port: 6529,
        inline: true,
        publicPath: '/',
        contentBase: './dist',
    },
    entry: {
        index: path.join(__dirname, './index.js'),
    },
    output: {
        publicPath: '//localhost:6529/',
        path: path.join(__dirname, './dist'), // 打包后的文件存放的地方
        filename: '[name]_[hash].js', // 打包后输出文件的文件名
        chunkFilename: '[name]_[chunkhash].js',
    },
    resolve: {
        extensions: ['.js', '.jsx', '.vue', '.scss', '.css'],
        alias: {
            vue$: 'vue/dist/vue.js',
        },
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: [
                    {
                        loader: 'vue-loader',
                        options: {
                            compilerOptions: {
                                preserveWhitespace: false,
                            },
                            loaders: {
                                js: {
                                    loader: 'babel-loader',
                                    options: {
                                        cacheDirectory: true,
                                        presets: ['es2015', 'stage-2'],
                                        plugins: [
                                            'add-module-exports',
                                            'transform-es2015-modules-commonjs',
                                        ],
                                    },
                                },
                                css: ExtractTextPlugin.extract({
                                    use: ['css-loader'],
                                    fallback: 'vue-style-loader',
                                }),
                                sass: ExtractTextPlugin.extract({
                                    use: ['css-loader', 'sass-loader'],
                                    fallback: 'vue-style-loader',
                                }),
                                less: ExtractTextPlugin.extract({
                                    use: ['css-loader', 'less-loader'],
                                    fallback: 'vue-style-loader',
                                }),
                            }
                        },
                    },
                    {
                        loader: path.resolve(__dirname, '../index.js'),
                        options: styleImportOptions,
                    },
                ],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            presets: ['es2015', 'stage-2'],
                            plugins: [
                                'add-module-exports',
                                'transform-es2015-modules-commonjs',
                            ],
                        },
                    },
                    {
                        loader: path.resolve(__dirname, '../index.js'),
                        options: styleImportOptions,
                    },
                ],
            },
            {
                test: /\.(css)$/,
                use: ExtractTextPlugin.extract({
                    use: ['css-loader'],
                }),
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    use: ['css-loader', 'sass-loader'],
                }),
            },
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    use: ['css-loader', 'less-loader'],
                }),
            },
        ],
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss() {
                    return [precss, autoprefixer];
                },
            },
        }),
        new HtmlWebpackPlugin({
            alwaysWriteToDisk: true,
            chunks: ['index'],
            filename: 'index.html',
            template: path.join(__dirname, './index.html'),
        }),
        new ExtractTextPlugin({
            filename: '[name].css',
            // allChunks: true,
        }),
        new HtmlWebpackHarddiskPlugin(),
    ],
};
