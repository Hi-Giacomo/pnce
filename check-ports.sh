#!/bin/bash

echo "🔍 检查常用端口占用情况..."

# 检查主服务端口3000
echo ""
echo "📡 检查端口 3000 (主服务):"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "❌ 端口 3000 被占用:"
    lsof -i :3000
    echo ""
    echo "🔧 解决方案:"
    echo "   终止进程: kill $(lsof -t -i :3000)"
    echo "   或强制终止: kill -9 $(lsof -t -i :3000)"
else
    echo "✅ 端口 3000 可用"
fi

# 检查微服务端口范围 3001-3010
echo ""
echo "📡 检查微服务端口 3001-3010:"
for port in {3001..3010}; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo "❌ 端口 $port 被占用: $(lsof -i :$port | tail -n +2 | awk '{print $1 " (PID: " $2 ")"}')"
    fi
done

# 如果没有占用，显示可用
if ! lsof -i :300{1..10} > /dev/null 2>&1; then
    echo "✅ 微服务端口 3001-3010 都可用"
fi

echo ""
echo "💡 快速清理所有相关端口的命令:"
echo "   # 清理主服务端口"
echo "   kill \$(lsof -t -i :3000) 2>/dev/null || true"
echo ""
echo "   # 清理微服务端口"
echo "   for port in {3001..3010}; do kill \$(lsof -t -i :\$port) 2>/dev/null || true; done"
