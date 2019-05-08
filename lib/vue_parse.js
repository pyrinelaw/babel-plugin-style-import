const compiler = require('vue-template-compiler');
const cache = require('lru-cache')(100);
const hash = require('hash-sum');

/**
 * 接续 vue 文本， 中参考了 vue-loader 对 vue 文件的解析方式
 */
module.exports = (content) => {
    const cacheKey = hash(content);
    let output = cache.get(cacheKey);

    if (output) return output;

    output = compiler.parseComponent(content);
    // output = compiler.parseComponent(content, { pad: 'line' });

    return output;
}