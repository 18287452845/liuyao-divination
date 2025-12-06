/**
 * 密码策略工具
 * 用于密码复杂度验证、密码重置等
 */

import bcrypt from 'bcryptjs';

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  specialChars: string;
  forbiddenPatterns: string[];
  preventCommonPasswords: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
}

// 默认密码策略
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 50,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  forbiddenPatterns: ['123456', 'password', 'qwerty', 'admin', 'user'],
  preventCommonPasswords: true
};

// 常见弱密码列表
const COMMON_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345', '1234567',
  '1234567890', '1234', 'qwerty', 'abc123', 'password123', 'admin',
  'letmein', 'welcome', 'monkey', '1234567890', 'qwertyuiop',
  'asdfghjkl', 'zxcvbnm', '111111', '000000', '123123'
];

/**
 * 验证密码是否符合策略
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // 长度检查
  if (password.length < policy.minLength) {
    errors.push(`密码长度至少需要 ${policy.minLength} 个字符`);
  } else if (password.length >= policy.minLength + 4) {
    score += 1;
  }

  if (password.length > policy.maxLength) {
    errors.push(`密码长度不能超过 ${policy.maxLength} 个字符`);
  }

  // 大写字母检查
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // 小写字母检查
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // 数字检查
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  } else if (/\d/.test(password)) {
    score += 1;
  }

  // 特殊字符检查
  if (policy.requireSpecialChars) {
    const specialCharRegex = new RegExp(`[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push(`密码必须包含至少一个特殊字符: ${policy.specialChars}`);
    } else {
      score += 1;
    }
  }

  // 禁用模式检查
  for (const pattern of policy.forbiddenPatterns) {
    if (password.toLowerCase().includes(pattern.toLowerCase())) {
      errors.push(`密码不能包含常见模式: ${pattern}`);
    }
  }

  // 常见密码检查
  if (policy.preventCommonPasswords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('不能使用常见密码');
  }

  // 计算密码强度
  let strength: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak';
  if (score >= 5) {
    strength = 'very_strong';
  } else if (score >= 4) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * 检查密码是否已被泄露（简单实现）
 * 在实际应用中，可以使用 HaveIBeenPwned API
 */
export async function checkPasswordBreach(password: string): Promise<boolean> {
  // 这里是一个简化的实现
  // 实际应用中应该调用真正的密码泄露检查API
  const commonPatterns = [
    /^123456/, /^password/, /^qwerty/, /^admin/,
    /123456$/, /password$/, /qwerty$/, /admin$/,
    /123456.*123456/, /password.*password/, /qwerty.*qwerty/
  ];

  return commonPatterns.some(pattern => pattern.test(password.toLowerCase()));
}

/**
 * 生成密码重置令牌
 */
export function generatePasswordResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * 生成随机密码
 */
export function generateRandomPassword(
  length: number = 12,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = policy.specialChars;
  
  let chars = '';
  let password = '';

  // 确保包含必需的字符类型
  if (policy.requireUppercase) {
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    chars += uppercase;
  }

  if (policy.requireLowercase) {
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    chars += lowercase;
  }

  if (policy.requireNumbers) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    chars += numbers;
  }

  if (policy.requireSpecialChars) {
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    chars += specialChars;
  }

  // 如果没有特殊要求，使用所有字符
  if (chars === '') {
    chars = uppercase + lowercase + numbers + specialChars;
  }

  // 填充剩余长度
  while (password.length < length) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // 打乱密码字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * 计算密码强度分数（0-100）
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;

  // 长度分数 (最高30分)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // 字符类型分数 (最高40分)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // 复杂度分数 (最高30分)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.5) score += 10;
  if (uniqueChars >= password.length * 0.7) score += 10;
  if (uniqueChars >= password.length * 0.9) score += 10;

  return Math.min(100, score);
}

/**
 * 检查密码是否需要更新（基于上次修改时间）
 */
export function shouldUpdatePassword(lastChangeTime: Date, maxDays: number = 90): boolean {
  const now = new Date();
  const daysSinceChange = Math.floor((now.getTime() - lastChangeTime.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceChange >= maxDays;
}

/**
 * 获取密码强度描述
 */
export function getPasswordStrengthDescription(score: number): {
  level: 'weak' | 'medium' | 'strong' | 'very_strong';
  text: string;
  color: string;
} {
  if (score < 30) {
    return {
      level: 'weak',
      text: '弱',
      color: 'red'
    };
  } else if (score < 60) {
    return {
      level: 'medium',
      text: '中等',
      color: 'orange'
    };
  } else if (score < 80) {
    return {
      level: 'strong',
      text: '强',
      color: 'blue'
    };
  } else {
    return {
      level: 'very_strong',
      text: '非常强',
      color: 'green'
    };
  }
}

/**
 * 验证密码重置令牌
 */
export function validatePasswordResetToken(token: string): boolean {
  // 简单的令牌格式验证
  return /^[A-Za-z0-9]{32}$/.test(token);
}

/**
 * 生成安全的密码哈希
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}