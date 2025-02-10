import * as CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

// 加密配置接口
interface EncryptionConfig {
  secretKey: string;
  accessKey: string;
}

// 加密配置
export const ENCRYPTION_CONFIG: EncryptionConfig = {
  secretKey: 'nZYPci3jhJJoYzU2',
  accessKey: 'mByqaSdYnUaHWY9i'
};

/**
 * 加密工具类
 */
export class EncryptionUtil {
  /**
   * AES加密
   * @param text 待加密文本
   * @param secretKey 密钥
   * @param iv 初始向量
   * @returns 加密后的文本
   */
  static aesEncrypt(text: string, secretKey: string, iv: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, secretKey, { iv });
      return encrypted.toString();
    } catch (error) {
      console.error('加密失败:', error);
      throw error;
    }
  }

  /**
   * 生成签名
   * @param accessKey 访问密钥
   * @param secretKey 密钥
   * @returns 签名字符串
   */
  static generateSignature(accessKey: string, secretKey: string): string {
    const timeStamp = new Date().getTime();
    const comboxKey = `${accessKey}|${uuidv4()}|${timeStamp}`;
    return this.aesEncrypt(comboxKey, secretKey, accessKey);
  }
}

/**
 * 请求头工具类
 */
export class HeadersUtil {
  /**
   * 获取默认请求头
   * @param accessKey 访问密钥
   * @param signature 签名
   * @returns 请求头对象
   */
  static getDefaultHeaders(accessKey: string, signature: string): Record<string, string> {
    return {
      'User-Agent': 'python-requests/2.25.1',
      'Content-Type': 'application/json',
      'ACCEPT': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'accessKey': accessKey,
      'signature': signature
    };
  }

  /**
   * 设置请求头
   * @param config 加密配置
   * @returns 包含headers的对象
   */
  static setHeaders(config: EncryptionConfig): { headers: Record<string, string> } {
    const signature = EncryptionUtil.generateSignature(
      config.accessKey,
      config.secretKey
    );
    
    return {
      headers: this.getDefaultHeaders(config.accessKey, signature)
    };
  }
}

export type { EncryptionConfig }; 