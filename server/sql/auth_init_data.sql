-- 六爻排盘系统 - 认证和权限初始数据
-- 默认管理员账号、角色、权限配置

USE liuyao_db;

-- ====================================
-- 1. 插入默认角色
-- ====================================
INSERT INTO roles (id, role_name, role_code, description, status) VALUES
('role-admin-001', '系统管理员', 'admin', '拥有系统所有权限，可以管理用户、角色和权限', 1),
('role-user-001', '普通用户', 'user', '可以使用六爻占卜功能，查看自己的历史记录', 1),
('role-vip-001', 'VIP用户', 'vip', '可以使用所有占卜功能和AI分析，无次数限制', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================
-- 2. 插入默认权限
-- 包含：占卜模块权限(perm-div-001至005)、用户管理权限(perm-user-001至005)、
--      角色管理权限(perm-role-001至005)、权限管理权限(perm-perm-001至002)
-- ====================================
INSERT INTO permissions (id, permission_name, permission_code, description, module, status) VALUES
('perm-div-001', '创建占卜', 'divination:create', '允许创建新的占卜记录', 'divination', 1),
('perm-div-002', '查看占卜', 'divination:view', '允许查看占卜记录', 'divination', 1),
('perm-div-003', '删除占卜', 'divination:delete', '允许删除占卜记录', 'divination', 1),
('perm-div-004', '查看所有占卜', 'divination:viewAll', '允许查看所有用户的占卜记录', 'divination', 1),
('perm-div-005', '使用AI分析', 'divination:aiAnalysis', '允许使用AI分析功能', 'divination', 1),
('perm-user-001', '创建用户', 'user:create', '允许创建新用户', 'user', 1),
('perm-user-002', '查看用户', 'user:view', '允许查看用户信息', 'user', 1),
('perm-user-003', '编辑用户', 'user:edit', '允许编辑用户信息', 'user', 1),
('perm-user-004', '删除用户', 'user:delete', '允许删除用户', 'user', 1),
('perm-user-005', '禁用/启用用户', 'user:status', '允许禁用或启用用户账号', 'user', 1),
('perm-role-001', '创建角色', 'role:create', '允许创建新角色', 'role', 1),
('perm-role-002', '查看角色', 'role:view', '允许查看角色信息', 'role', 1),
('perm-role-003', '编辑角色', 'role:edit', '允许编辑角色信息', 'role', 1),
('perm-role-004', '删除角色', 'role:delete', '允许删除角色', 'role', 1),
('perm-role-005', '分配权限', 'role:assignPermission', '允许为角色分配权限', 'role', 1),
('perm-perm-001', '查看权限', 'permission:view', '允许查看权限信息', 'permission', 1),
('perm-perm-002', '管理权限', 'permission:manage', '允许管理权限配置', 'permission', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================
-- 3. 为管理员角色分配所有权限
-- ====================================
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT
  CONCAT('rp-', SUBSTRING(MD5(CONCAT(r.id, p.id)), 1, 32)) as id,
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'admin' AND p.status = 1
ON DUPLICATE KEY UPDATE role_permissions.created_at = role_permissions.created_at;

-- ====================================
-- 4. 为普通用户角色分配基础权限
-- ====================================
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT
  CONCAT('rp-', SUBSTRING(MD5(CONCAT(r.id, p.id)), 1, 32)) as id,
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'user'
  AND p.permission_code IN (
    'divination:create',
    'divination:view',
    'divination:delete'
  )
ON DUPLICATE KEY UPDATE role_permissions.created_at = role_permissions.created_at;

-- ====================================
-- 5. 为VIP用户角色分配占卜相关所有权限
-- ====================================
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT
  CONCAT('rp-', SUBSTRING(MD5(CONCAT(r.id, p.id)), 1, 32)) as id,
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'vip'
  AND p.module = 'divination'
ON DUPLICATE KEY UPDATE role_permissions.created_at = role_permissions.created_at;

-- ====================================
-- 6. 创建默认管理员账号
-- 密码: admin123 (使用bcrypt加密，轮次10)
-- ====================================
INSERT INTO users (id, username, password, email, real_name, status) VALUES
('user-admin-001', 'admin', '$2a$10$V22LB4ExPdxHWa.8SVSwBuJUwC0iEjSYRxsWC076yHUY9cgVrQDXS', 'admin@liuyao.com', '系统管理员', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================
-- 7. 为默认管理员分配管理员角色
-- ====================================
INSERT INTO user_roles (id, user_id, role_id)
SELECT
  'ur-admin-001' as id,
  u.id as user_id,
  r.id as role_id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' AND r.role_code = 'admin'
ON DUPLICATE KEY UPDATE user_roles.created_at = user_roles.created_at;

-- ====================================
-- 8. 创建测试用户账号
-- 用户名: testuser, 密码: test123
-- ====================================
INSERT INTO users (id, username, password, email, real_name, status) VALUES
('user-test-001', 'testuser', '$2a$10$vhfaBKD2zUtCqaGbRnMYT.xPTpVYiXxD.CkURjPO87WVi9bJFF1Fa', 'test@liuyao.com', '测试用户', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================
-- 9. 为测试用户分配普通用户角色
-- ====================================
INSERT INTO user_roles (id, user_id, role_id)
SELECT
  'ur-test-001' as id,
  u.id as user_id,
  r.id as role_id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'testuser' AND r.role_code = 'user'
ON DUPLICATE KEY UPDATE user_roles.created_at = user_roles.created_at;
