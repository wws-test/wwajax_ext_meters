/**
 * Chrome Storage 数据接口
 */
interface StorageData {
  projectid?: string;
  user?: string;
  [key: string]: any;
}

/**
 * Chrome Storage 工具类
 */
export class ChromeStorageUtil {
  /**
   * 获取数据
   * @returns Promise<StorageData>
   */
  static async getData(): Promise<StorageData> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['projectid', 'user'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error('获取数据失败: ' + chrome.runtime.lastError.message));
        } else {
          resolve({
            projectid: result.projectid,
            user: result.user
          });
        }
      });
    });
  }

  /**
   * 保存数据
   * @param data 要保存的数据
   * @returns Promise<void>
   */
  static async saveData(data: StorageData): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error('保存数据失败: ' + chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 获取指定键的数据
   * @param keys 要获取的键名数组
   * @returns Promise<any>
   */
  static async get(keys: string | string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error('获取数据失败: ' + chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 设置数据
   * @param items 要设置的数据对象
   * @returns Promise<void>
   */
  static async set(items: { [key: string]: any }): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error('设置数据失败: ' + chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}

export type { StorageData }; 