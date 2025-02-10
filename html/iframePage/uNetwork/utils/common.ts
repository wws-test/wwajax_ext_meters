/**
 * 格式化文本
 * @param value 需要格式化的字符串
 * @returns 格式化后的文本
 */
export const formatText = (value: string): string => {
  try {
    return JSON.stringify(JSON.parse(value), null, 4);
  } catch {
    return value;
  }
};

/**
 * 将字符串转换为正则表达式
 * @param regStr 正则表达式字符串
 * @returns RegExp对象
 */
export const strToRegExp = (regStr: string): RegExp => {
  let regexp = new RegExp('');
  try {
    const regParts = regStr.match(new RegExp('^/(.*?)/([gims]*)$'));
    if (regParts) {
      regexp = new RegExp(regParts[1], regParts[2]);
    } else {
      regexp = new RegExp(regStr);
    }
  } catch (error) {
    console.error('正则表达式转换错误:', error);
  }
  return regexp;
};

/**
 * 从Chrome本地存储获取数据
 * @param keys 需要获取的键名
 * @returns Promise<any>
 */
export const getChromeLocalStorage = (keys: string | string[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}; 