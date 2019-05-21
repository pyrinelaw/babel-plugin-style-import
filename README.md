### babel-plugin-style-import

webpack loader 组件，组件样式单独引入

达到类似效果：
``` javascript
import {
    DatePicker, 
    message, 
    Alert,
} from 'antd';
// => 
import 'antd/lib/date-picker/style/index.less';
import 'antd/lib/message/style/index.less';
import 'antd/lib/alert/style/index.less';
import {
    DatePicker, 
    message, 
    Alert,
} from 'antd';
```

### 配置示例
babel-plugin-style-import 需要在 loader 中优先执行，而 webpack 中
loader 又是倒序执行的，所以 babel-plugin-style-import 配置需要放置在最后

以 antd 与 vant 为例
``` javascript
const styleOptions = {
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

rules: [
    {
        test: /\.vue$/,
        use: [
            {
                loader: 'vue-loader',
                options: {
                   ...
                },
            },
            {
                loader: 'babel-plugin-style-import',
                options: styleOptions,
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
                    ...
                },
            },
            {
                loader: 'babel-plugin-style-import',
                options: styleOptions,
            },
        ],
    },
],
```

### 配置 Api
list [array]

| 参数 | 类型 | 是否必传 | 默认值 | 说明 |
| :------ | :------ | :------ | :------ | :------ | 
|name |String |是 | 无 |组件库名 | 
|splitChart |String |否 |'_' |组件文件夹拆分字符，('HeadBack', '_') => 'head_back'| 
|style |String 或 Function |否 |无 | 样式文件名，使用“{{name}}”进行替换，或者返回用户自定义style | 

style arguments [function]

| 参数 | 类型 | 说明 |
| :------ | :------ | :------ |
|name |String |子组件名 | 
|@return |String | 返回样式文件路径，不返回的情况下忽略输出 |

babel-import-style-import/util

``` javascript
const util = require('babel-plugin-style-import/lib/util.js');
util.convertName('HeadBack', '-');  // output 'head-back'
```

### github
[https://github.com/pyrinelaw/babel-plugin-style-import](https://github.com/pyrinelaw/babel-plugin-style-import)

### test 目录
- /test