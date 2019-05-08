### babel-plugin-style-import

webpack loader组件，解决样式单独引入问题，参考 babel-plugin-import，同时存在一定的差异化。[babel-plugin-import](https://github.com/ant-design/babel-plugin-import)

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

### 与 babel-plugin-import 比较：
- 只能按需加载组价库中的样式资源，不能按需加载 js 文件
- 可以自定义分隔符
- 组件库中不需要通过 js 对样式文件进行引入
- 同样支持 css/scss/less 资源文件

### 配置示例
babel-plugin-style-import 需要在 loader 中优先执行，而 webpack 中
loader 又是倒序执行的，所以 babel-plugin-style-import 配置需要放置在最后

以 antd 与 vant 为例
``` javascript
{
    loader: 'babel-plugin-style-import',
    options: {
        libraryList: [
            {
                // npm 组件库名称
                libraryName: 'antd',
                camel2DashSplitChart: '-',
                // 样式文件名，css/scss/less 均可
                // 最终导出为 {{libraryName}}/{{styleFileName}}
                styleFileName: 'lib/{{name}}/style/index.less',
            },
            {
                // npm 组件库名称
                libraryName: 'vant',

                // 自定义样式文件名，css/scss/less 均可
                // 最终生成路径 {{libraryName}}/{{customStyleFileName}}
                // 未返回路径时，将不会导入样式文件
                // 传入 customStyleFileName 时， camel2DashSplitChart 与 styleFileName 参数将失效
                customStyleFileName: function(name, libraryOptions) {
                    const stylePath = `lib/vant-css/${retuire('babel-plugin-style-import/lib/util').convertName(name, '-')}.css`;
                    const completeStylePath = path.resolve(__dirname, `./node_modules/vant/${stylePath}`);
                    
                    if (fs.existsSync(completeStylePath)) {
                        return stylePath;
                    } else {
                        console.warn(`The file ${stylePath} is not exists！`);
                    }
                },
            }
        ],
    },
},
```

### 配置 Api
libraryList [array]

| 参数 | 类型 | 是否必传 | 默认值 | 说明 |

| :------ | :------ | :------ | :------ | :------ | 

|libraryName |String |是 | 无 |组件库名 | 

|camel2DashSplitChart |String |否 |'_' |组件文件夹拆分字符，('HeadBack', '_') => 'head_back'| 

|styleFileName |String |否 |无 | 样式文件名，使用“{{name}}”进行替换 | 

|customStyleFileName |Function |否 |无 |自定义样式文件名，定义了当前参数的情况下 camel2DashSplitChart 与 styleFileName 参数将会失效，不 return 的情况下会忽略输出 | 

customStyleFileName arguments [function]

| 参数 | 类型 | 说明 |
| :------ | :------ | :------ |
|name |String |子组件名 | 
|libraryOptions |Object |当前转换组件数据对象|
|@return |String | 返回样式文件路径，不返回的情况下忽略输出 |

babel-import-style-import/util

``` javascript
const util = require('babel-plugin-style-import/lib/util.js');
util.convertName('HeadBack', '-');  // output 'head-back'
```

### github
[]()

### demo 路径
/test_js
/test_vue