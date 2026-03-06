#!/bin/bash

# PNCE CLI 自动补全安装脚本

set -e

SHELL_TYPE=$(basename "$SHELL")

echo "🚀 安装 PNCE CLI 自动补全..."

case "$SHELL_TYPE" in
  bash)
    if ! grep -q "pnce completion" "$HOME/.bashrc" 2>/dev/null; then
      echo "" >> "$HOME/.bashrc"
      echo "# PNCE CLI 自动补全" >> "$HOME/.bashrc"
      echo "eval \"\$(pnce completion)\"" >> "$HOME/.bashrc"
      echo "✅ 已添加到 ~/.bashrc"
      echo "请运行: source ~/.bashrc"
    else
      echo "⚠️  自动补全已配置"
    fi
    ;;
  zsh)
    if ! grep -q "pnce completion" "$HOME/.zshrc" 2>/dev/null; then
      echo "" >> "$HOME/.zshrc"
      echo "# PNCE CLI 自动补全" >> "$HOME/.zshrc"
      echo "eval \"\$(pnce completion)\"" >> "$HOME/.zshrc"
      echo "✅ 已添加到 ~/.zshrc"
      echo "请运行: source ~/.zshrc"
    else
      echo "⚠️  自动补全已配置"
    fi
    ;;
  fish)
    COMPLETION_DIR="$HOME/.config/fish/completions"
    mkdir -p "$COMPLETION_DIR"
      pnce completion > "$COMPLETION_DIR/pnce.fish"
      echo "✅ 已创建 $COMPLETION_DIR/pnce.fish"
      echo "请重新启动 Fish shell"
    else
      echo "⚠️  自动补全已配置"
    fi
    ;;
  *)
    echo "❌ 不支持的 shell: $SHELL_TYPE"
    echo "支持的 shell: bash, zsh, fish"
    echo ""
    echo "手动安装方法："
    echo "  Bash:  echo \"eval \\\"\\\$(pnce completion)\\\"\" >> ~/.bashrc"
    echo "  Zsh:   echo \"eval \\\"\\\$(pnce completion)\\\"\" >> ~/.zshrc"
    echo "  Fish:  pnce completion > ~/.config/fish/completions/pnce.fish"
    exit 1
    ;;
esac

echo "🎉 安装完成！输入 'pnce <Tab>' 测试自动补全功能"
