/**
 * 转换名称
 *  转换结果示例： (name = 'HeadBack', split = '_') => 'head_back'
 * @param {*} name 文件夹名
 * @param {*} split 分隔符，不传入的情况下返回传入 name
 */
const convertName = function(name, split) {
    if (split) {
        const newName = name.replace(/([A-Z])/g, `${split}$1`).toLowerCase();

        if (newName.startsWith(split)) {
            return newName.replace(split, '');
        }

        return newName;
    }
    return name;
}

module.exports = {
    convertName: convertName,
}