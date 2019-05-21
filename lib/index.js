const fs = require('fs');
const _ = require('lodash');
const babelParse = require('@babel/parser');
const babelGenerate = require('@babel/generator');
const vueParse = require('./vue_parse.js');
const loaderUtils = require('loader-utils');
const colors = require('colors');
const util = require('./util.js');

const JS_FILE = 'js';
const VUE_FILE = 'vue';
const CSS_FILE = 'css';
const SCSS_FILE = 'scss';
const LESS_FILE = 'less';
const IMPORT_DECLARATION = 'ImportDeclaration';

/**
 * 获取文件类型
 *  包括 js/vue
 * @param {*} resourcePath 文件路径
 */
const getFileType = function(resourcePath) {
    const filePath = (resourcePath || '').toLocaleLowerCase();

    if (filePath.endsWith('.vue')) {
        return VUE_FILE;
    } else if (filePath.endsWith('.js')) {
        return JS_FILE;
    }
    
    return undefined;
}

/**
 * 获取样式文本类型
 *  包括 css/scss/less
 * @param {*} styleName 样式文件名
 */
const getStyleFileType = function(styleName) {
    const filePath = (styleName || '').toLocaleLowerCase();
    
    if (filePath.endsWith(`.${CSS_FILE}`)) {
        return CSS_FILE;
    } else if (filePath.endsWith(`.${SCSS_FILE}`)) {
        return SCSS_FILE;
    } else if (filePath.endsWith(`.${LESS_FILE}`)) {
        return LESS_FILE;
    }

    return undefined;
}

/**
 * 根据库名找到对应配置
 * @param {*} name 库名
 * @param {*} libraryList 库集合
 */
const getLibrayOptions = function(name, libraryList = []) {
    return _.find(libraryList, function(d) {
        return d.name === name;
    });
}

/**
 * 获取需要导入组件列表
 * @param {*} ast js ast
 * @param {*} libraryList 需要处理的库
 */
const getImportComponentList = function(ast, libraryList) {
    const body = _.get(ast, 'program.body', []);
    const list = [];

    // 循环 ast 中的 import 导入
    body.forEach(function(d, i) {
        const from = _.get(d, 'source.extra.rawValue');
        const targetLibrayOptions = getLibrayOptions(from, libraryList);

        const librayOptions = (d.type === IMPORT_DECLARATION) && targetLibrayOptions;

        if (librayOptions) {
            const data = { list: [] };
            // 需要引入的子组件
            const specifiers = _.get(d, 'specifiers', []);

            data.librayOptions = targetLibrayOptions;
            // astIdx、startLine、endLine 目前未使用到，后续扩展~[捂脸]
            data.astIdx = i;
            data.startLine = _.get(d, 'loc.start.line', 0);
            data.endLine = _.get(d, 'loc.end.line', 0);
            
            specifiers.forEach(function(specifier) {
                const importName = _.get(specifier, 'imported.name');
                if (importName) {
                    data.list.push(importName);
                }
            });
            data.isNeed = data.list.length > 0;
            list.push(data);
        }
    });

    return list;
}

/**
 * 获取真实文件夹名
 *  默认输入输出：HeadBack => head_back
 * @param {*} name 子组件名
 * @param {*} librayOptions 
 */
const getRawDirName = function(name, librayOptions) {
    return librayOptions.splitChart ? 
        util.convertName(name, librayOptions.splitChart) :
        name;
}   

/**
 * 获取样式文件路径
 *  返回的是位于 libray 目录的相对路径，不是绝对路径
 * @param {*} subComponent 子组件名
 * @param {*} component 付组件
 */
const getImportStyleFilePath = function(subComponent, component) {
    const librayOptions = component.librayOptions || {};
    const style = librayOptions.style;
    
    let newPath = '';
    
    // 使用自定义路径，以用户自定义路径为准
    if (typeof(style) == 'function') {
        return style(subComponent);
    }

    // 未使用自定义路径，通过 正则与 getRawDirName 进行转换
    if (typeof(style) == 'string') {
        newPath = style.replace(/\{\{name\}\}/g, getRawDirName(subComponent, librayOptions));
    }

    return newPath;
}

/**
 * 获取子组件中导入样式文本
 * @param {*} subComponent 子组件名
 * @param {*} component 组件
 * @param {*} isVue 是否给 vue 文件使用
 */
const getSubComponentStyleString = function(subComponent, component, isVue = false) {
    const librayOptions = component.librayOptions || {};
    const styleFilePath = getImportStyleFilePath(subComponent, component);

    if (!styleFilePath) return undefined;

    if (!getStyleFileType(styleFilePath)) {
        console.warn(`babel-plugin-style-import warning：${styleFilePath} ’s file type not of style，Please choose the file by “css”/“scss”/“less”!`.yellow);
        return undefined;
    } else {
        return isVue ? 
            `@import '~${librayOptions.name}/${styleFilePath}';` :
            `import '${librayOptions.name}/${styleFilePath}';`;
    }
}

/**
 * 获取组件中需要导入样式文本
 * @param {*} component 
 */
const getComponentStyleString = function(component) {
    let styleString = '';

    if (component.isNeed) {
        (component.list || []).forEach(function(d) {
            const subComponentStyleString = getSubComponentStyleString(d, component)
            
            if (subComponentStyleString) {
                styleString += `${subComponentStyleString}\n`;
            }
        });
    }

    return styleString;
}

/**
 * 在 js 文件文本中导入样式标签
 * @param {*} source js 文本
 * @param {*} componentList 组件列表 
 */
const insertStyleImportToJsSource = function(source, componentList) {
    let prex = '';

    componentList.forEach(component => {
        prex += getComponentStyleString(component);
    });

    return `${prex}${source}`;
}

/**
 * 根据样式类型获取样式解析结果中的第一个样式标签
 * @param {*} list 样式结果解析列表
 * @param {*} type 样式类型
 */
const getStyleResByStyleType = function(list, type) {
    const targetType = type || CSS_FILE;

    return _.find(list, function(d) {
        const curType = d.lang || CSS_FILE;
        return curType === targetType;
    });
}

/**
 * 创建样式解析结果
 * @param {*} type 样式类型，默认为 css
 */
const createStyleRes = function(type) {
    return {
        type: 'style', 
        lang: type || CSS_FILE,
        content: '',
    }
};

/**
 * 在 vue 样式标签中插入样式导入
 * @param {*} styleResList 样式解析结果列表
 * @param {*} componentList 需要插入组件列表
 */
const insertStyleImportToVueStyles = function(styleResList, componentList) {
    // 避免引用影响，设置新的列表
    const newList = Array.prototype.slice.call(styleResList, 0);

    // 循环组件列表
    componentList.forEach(function(component) {
        // 循环子组件列表
        component.list.forEach(function(subComponent) {
            // 获取子组件插入样式文本
            const subComponentStyleString = getSubComponentStyleString(subComponent, component, true);
            
            // 不存在文本，无需处理
            if (!subComponentStyleString) return;

            // 获取文本文件路径
            const styleFilePath = getImportStyleFilePath(subComponent, component);
            // 根据文本路径判断样式文本类型
            const styleFileType = getStyleFileType(styleFilePath);

            // 获取样式解析结果中的符合文本类型的标签
            let styleRes = getStyleResByStyleType(newList, styleFileType);

            // 不存在符合要求的标签需要创建标签，并插入到样式结果列表中
            if (!styleRes) {
                styleRes = createStyleRes(styleFileType);
                newList.push(styleRes);
            }
            // 插入样式标签内置文本最前头
            styleRes.content = `${subComponentStyleString}\n${styleRes.content}`;
        });
    });

    return newList;
}

/**
 * 根据 vue 解析结果 转换 vue 文本
 * @param {*} res 
 */
const convertSourceByVueRes = function(res) {
    let source = '';
    const template = `<template>${(_.get(res, 'template.content') || '')}</template>\n`;
    const script = `<script>${(_.get(res, 'script.content') || '')}</script>`;
    let styles = '';
    res.styles.forEach(function(d) {
        styles += `<style lang="${d.lang || CSS_FILE}">${d.content || ''}</style>\n`;
    });

    source = `${template}${styles}${script}`;

    return source;
}

/**
 * 转换 js 文件 source
 * @param String source js 文件内容
 * @param Array libraryList 需要处理的库
 */
const convertJsSource = function(source, libraryList) {
    // 使用 @babel/parse 库将文本转换为 ast
    // 新版 webpack 官方使用的就是 @babel/parse 转换ast，老版中使用的是 babylon
    const ast = babelParse.parse(source, {
        sourceType: 'unambiguous',
    });

    // 获取需要转换后需要导入的组件列表
    const componentList = getImportComponentList(ast, libraryList);

    // 返回插入组件列表后并进行处理的文本
    return insertStyleImportToJsSource(source, componentList);
}

/**
 * 转换 vue 文件 source
 * @param String source vue 文件内容
 * @param Array libraryList 需要处理的库
 */
const convertVueSource = function(source, libraryList) {
    // vue 文件解析结果， vueParse 中参考了 vue-loader 对 vue 文件的处理方式
    const vueRes = vueParse(source);
    // vue 文件中的 js 内容
    const jsSource = _.get(vueRes, 'script.content', '') || '';
    // vue 文件中的样式内容，可能存在多个样式标签，所以是一个数组
    const styleResList = _.get(vueRes, 'styles', []) || [];
    // vue 文件与 js 文件的不同点在于 vue 中的 样式需要导入在 style 标签中
    // 需要单独处理 js 的 ast
    const jsAst = babelParse.parse(jsSource, {
        sourceType: 'unambiguous',
    });
    const componentList = getImportComponentList(jsAst, libraryList);
    // 往样式标签中插入组件列表，得到新的样式集合
    const newStyleResList = insertStyleImportToVueStyles(styleResList, componentList);

    // 重置样式集合
    vueRes.styles = newStyleResList;

    // 根据新的 vue 接续结果，返回转换后的 vue 文本
    return convertSourceByVueRes(vueRes);
}

const styleImport = function(source, a, b) {
    const rawOptions = loaderUtils.getOptions(this) || {};
    const resourcePath = this.resourcePath; // 当前编译文件路径
    const fileType = getFileType(resourcePath);

    // 循环 设置 libray 库中默认文件夹转换规则未下划线转换规则 
    const libraryList = (rawOptions.list || []).map(d => {
        return Object.assign(
            {}, 
            {splitChart: '_'},
            d,
        );
    });

    // 非 js/vue 文件，原路返回 source
    if (!fileType) {
        console.log(`babel-plugin-style-import warning：${resourcePath} ’s file type not of “vue”/“js”，Please choose the file by “vue”/“js”!`.yellow);
        return source;
    }

    if (fileType == JS_FILE) {
        return convertJsSource(source, libraryList);
    } 

    return convertVueSource(source, libraryList);
};

module.exports = styleImport;
