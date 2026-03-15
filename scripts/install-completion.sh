#!/bin/bash

# PNCE CLI Install

set -e

SHELL_TYPE=$(basename "$SHELL")

echo "🚀 Install PNCE CLI ..."

case "$SHELL_TYPE" in
  bash)
    if ! grep -q "pnce completion" "$HOME/.bashrc" 2>/dev/null; then
      echo "" >> "$HOME/.bashrc"
      echo "# PNCE CLI " >> "$HOME/.bashrc"
      echo "eval \"\$(pnce completion)\"" >> "$HOME/.bashrc"
      echo "✅  ~/.bashrc"
      echo "PleaseRun: source ~/.bashrc"
    else
      echo "⚠️  Configure"
    fi
    ;;
  zsh)
    if ! grep -q "pnce completion" "$HOME/.zshrc" 2>/dev/null; then
      echo "" >> "$HOME/.zshrc"
      echo "# PNCE CLI " >> "$HOME/.zshrc"
      echo "eval \"\$(pnce completion)\"" >> "$HOME/.zshrc"
      echo "✅  ~/.zshrc"
      echo "PleaseRun: source ~/.zshrc"
    else
      echo "⚠️  Configure"
    fi
    ;;
  fish)
    COMPLETION_DIR="$HOME/.config/fish/completions"
    mkdir -p "$COMPLETION_DIR"
      pnce completion > "$COMPLETION_DIR/pnce.fish"
      echo "✅ Create $COMPLETION_DIR/pnce.fish"
      echo "PleaseStart Fish shell"
    else
      echo "⚠️  Configure"
    fi
    ;;
  *)
    echo "❌  shell: $SHELL_TYPE"
    echo " shell: bash, zsh, fish"
    echo ""
    echo "InstallMethod："
    echo "  Bash:  echo \"eval \\\"\\\$(pnce completion)\\\"\" >> ~/.bashrc"
    echo "  Zsh:   echo \"eval \\\"\\\$(pnce completion)\\\"\" >> ~/.zshrc"
    echo "  Fish:  pnce completion > ~/.config/fish/completions/pnce.fish"
    exit 1
    ;;
esac

echo "🎉 InstallComplete！Input 'pnce <Tab>' TestFeature"
