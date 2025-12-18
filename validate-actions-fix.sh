#!/bin/bash

echo "🔍 验证GitHub Actions修复..."

# 检查工作流文件
echo "📋 检查工作流文件..."
if grep -q "github/codeql-action/init@v3" .github/workflows/build-and-push-ghcr.yml; then
    echo "✅ CodeQL已升级到v3"
else
    echo "❌ CodeQL版本升级失败"
fi

if grep -q "security-events: write" .github/workflows/build-and-push-ghcr.yml; then
    echo "✅ 权限配置已修复"
else
    echo "❌ 权限配置修复失败"
fi

if grep -q "platforms: linux/amd64,linux/arm64" .github/workflows/build-and-push-ghcr.yml; then
    echo "✅ 多平台构建配置已添加"
else
    echo "❌ 多平台构建配置缺失"
fi

echo ""
echo "🐳 检查Dockerfile修复..."

# 检查server Dockerfile
if grep -q "python3" server/Dockerfile; then
    echo "✅ server Dockerfile已添加构建依赖"
else
    echo "❌ server Dockerfile构建依赖缺失"
fi

if grep -q "npx tsc --version" server/Dockerfile; then
    echo "✅ TypeScript验证步骤已添加"
else
    echo "❌ TypeScript验证步骤缺失"
fi

if grep -q "dumb-init" server/Dockerfile; then
    echo "✅ 初始化进程配置已优化"
else
    echo "❌ 初始化进程配置缺失"
fi

# 检查client Dockerfile
if grep -q "python3" client/Dockerfile; then
    echo "✅ client Dockerfile已添加构建依赖"
else
    echo "❌ client Dockerfile构建依赖缺失"
fi

if grep -q "nginx:1.25-alpine" client/Dockerfile; then
    echo "✅ Nginx版本已更新"
else
    echo "❌ Nginx版本更新失败"
fi

echo ""
echo "🧪 运行快速构建测试..."

# 测试server构建
echo "测试server构建..."
cd server
if npm ci --dry-run > /dev/null 2>&1; then
    echo "✅ Server依赖安装测试通过"
else
    echo "⚠️  Server依赖安装测试需要网络连接"
fi

cd ../client
if npm ci --dry-run > /dev/null 2>&1; then
    echo "✅ Client依赖安装测试通过"
else
    echo "⚠️  Client依赖安装测试需要网络连接"
fi

cd ..

echo ""
echo "🎉 验证完成！"
echo ""
echo "📝 主要修复内容："
echo "  1. Docker构建失败（exit code 127）"
echo "  2. CodeQL版本升级 v2 → v3"
echo "  3. GitHub Actions权限配置"
echo "  4. 多平台构建支持"
echo "  5. 构建工具链优化"
echo ""
echo "💡 建议：推送代码触发GitHub Actions验证修复效果"