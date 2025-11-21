/**
 * 密码工具类
 * 使用bcrypt进行密码加密和验证
 */

import bcrypt from 'bcryptjs';

// bcrypt加密轮次，越高越安全但性能越慢
const SALT_ROUNDS = 10;

/**
 * 加密密码
 * @param password - 明文密码
 * @returns Promise<加密后的密码>
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error('密码加密失败');
  }
}

/**
 * 验证密码
 * @param password - 明文密码
 * @param hashedPassword - 加密后的密码
 * @returns Promise<是否匹配>
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('密码验证失败');
  }
}

/**
 * 同步方式加密密码
 * @param password - 明文密码
 * @returns 加密后的密码
 */
export function hashPasswordSync(password: string): string {
  try {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error('密码加密失败');
  }
}

/**
 * 同步方式验证密码
 * @param password - 明文密码
 * @param hashedPassword - 加密后的密码
 * @returns 是否匹配
 */
export function verifyPasswordSync(password: string, hashedPassword: string): boolean {
  try {
    const isMatch = bcrypt.compareSync(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('密码验证失败');
  }
}

/**
 * 验证密码强度
 * @param password - 密码
 * @returns 强度级别 (weak, medium, strong)
 */
export function checkPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (!password || password.length < 6) {
    return 'weak';
  }

  let score = 0;

  // 长度检查
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // 包含小写字母
  if (/[a-z]/.test(password)) score++;

  // 包含大写字母
  if (/[A-Z]/.test(password)) score++;

  // 包含数字
  if (/\d/.test(password)) score++;

  // 包含特殊字符
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

/**
 * 生成随机密码
 * @param length - 密码长度，默认12
 * @returns 随机密码
 */
export function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}';

  const allChars = lowercase + uppercase + numbers + symbols;

  let password = '';

  // 确保至少包含每种类型的字符
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // 打乱顺序
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
