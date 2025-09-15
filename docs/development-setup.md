# FlyCut Caption 开发环境配置指南

## 🛠️ 开发环境要求

### 系统要求
- **操作系统**: Windows 10+, macOS 10.15+, 或 Linux (Ubuntu 18.04+)
- **内存**: 最少 8GB，推荐 16GB+
- **存储**: 至少 10GB 可用空间
- **网络**: 稳定的互联网连接 (首次模型下载)

### 必需软件
- **Node.js**: 18.0+ (推荐 20.x LTS)
- **pnpm**: 8.0+
- **Rust**: 1.70+ (稳定版)
- **Git**: 2.30+

## 📦 环境安装指南

### 1. Node.js 和 pnpm 安装

#### macOS
```bash
# 使用 Homebrew
brew install node pnpm

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
npm install -g pnpm
```

#### Windows
```powershell
# 使用 Scoop (推荐)
scoop install nodejs pnpm

# 或使用 Chocolatey
choco install nodejs pnpm

# 或直接下载安装
# https://nodejs.org/
# https://pnpm.io/installation
```

#### Linux (Ubuntu/Debian)
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 或使用包管理器
sudo apt update
sudo apt install nodejs npm
npm install -g pnpm
```

### 2. Rust 安装

#### 所有平台 (推荐)
```bash
# 使用 rustup (官方推荐)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 验证安装
rustc --version
cargo --version
```

#### 配置 Rust 环境
```bash
# 添加必需的组件
rustup component add clippy rustfmt

# 设置默认工具链为稳定版
rustup default stable
rustup update
```

### 3. 平台特定依赖

#### macOS
```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 安装其他依赖
brew install cmake pkg-config
```

#### Windows
```powershell
# 安装 Visual Studio Build Tools
# 下载并安装: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# 或安装 Visual Studio Community
# 确保包含 "C++ build tools" 工作负载

# 使用 vcpkg (可选，用于 C++ 依赖)
git clone https://github.com/Microsoft/vcpkg.git
cd vcpkg
.\bootstrap-vcpkg.bat
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y \
    build-essential \
    cmake \
    pkg-config \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    libappindicator3-dev \
    librsvg2-dev

# CentOS/RHEL/Fedora
sudo dnf install -y \
    gcc \
    gcc-c++ \
    cmake \
    pkg-config \
    openssl-devel \
    gtk3-devel \
    webkit2gtk3-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel

# Arch Linux
sudo pacman -S \
    base-devel \
    cmake \
    pkg-config \
    openssl \
    gtk3 \
    webkit2gtk \
    libappindicator-gtk3 \
    librsvg
```

### 4. Tauri CLI 安装

```bash
# 安装 Tauri CLI
cargo install tauri-cli

# 验证安装
cargo tauri --version

# 或使用 pnpm 本地安装
pnpm add -D @tauri-apps/cli
```

## 🚀 项目搭建

### 1. 克隆项目
```bash
# 克隆现有项目
git clone https://github.com/your-org/fly-cut-caption.git
cd fly-cut-caption

# 或初始化新的 Tauri 项目
pnpm create tauri-app fly-cut-caption
cd fly-cut-caption
```

### 2. 安装依赖
```bash
# 安装前端依赖
pnpm install

# 自动安装 Rust 依赖 (cargo.toml)
# 会在首次运行时自动安装
```

### 3. 项目结构配置
```
fly-cut-caption/
├── package.json              # 前端依赖配置
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── components.json           # Shadcn/ui 配置
├── src/                      # React 前端源码
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── services/
│   └── utils/
├── src-tauri/               # Tauri Rust 后端
│   ├── Cargo.toml          # Rust 依赖配置
│   ├── tauri.conf.json     # Tauri 应用配置
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/       # Tauri 命令
│   │   ├── services/       # 业务服务
│   │   ├── models/         # 数据模型
│   │   └── utils/          # 工具函数
│   ├── icons/              # 应用图标
│   └── target/             # Rust 编译输出
└── docs/                   # 项目文档
```

### 4. 配置文件设置

#### package.json 脚本配置
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:info": "tauri info"
  }
}
```

#### Tauri 配置文件
```json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  }
}
```

## 🔧 开发工具配置

### 1. VS Code 推荐扩展

创建 `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 2. VS Code 工作区配置

创建 `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "rust-analyzer.cargo.allFeatures": true,
  "rust-analyzer.checkOnSave.command": "clippy"
}
```

### 3. Git 配置

创建 `.gitignore`:
```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
src-tauri/target/

# Environment files
.env
.env.local
.env.production

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/settings.json
.idea/

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed

# Temporary files
tmp/
.tmp/

# AI models cache
models/
cache/
```

## 🏃‍♂️ 开发工作流

### 1. 日常开发

```bash
# 启动开发环境
pnpm tauri dev

# 这将同时启动:
# - Vite 前端开发服务器 (http://localhost:5173)
# - Tauri 桌面应用窗口
# - 文件监视和热重载
```

### 2. 前端开发

```bash
# 仅启动前端开发服务器
pnpm dev

# 运行 linting
pnpm lint

# 运行类型检查
pnpm type-check

# 格式化代码
pnpm format
```

### 3. 后端开发

```bash
# 编译 Rust 代码
cargo build

# 运行 Rust 测试
cargo test

# Clippy 代码检查
cargo clippy

# 格式化 Rust 代码
cargo fmt
```

### 4. 构建和测试

```bash
# 开发构建
pnpm tauri build --debug

# 生产构建
pnpm tauri build

# 运行所有测试
pnpm test

# 运行端到端测试
pnpm test:e2e
```

## 🐛 故障排除

### 常见问题和解决方案

#### 1. Rust 编译错误
```bash
# 清理 Cargo 缓存
cargo clean

# 更新工具链
rustup update stable

# 重新安装依赖
rm Cargo.lock
cargo build
```

#### 2. Node.js 依赖问题
```bash
# 清理 pnpm 缓存
pnpm store prune

# 删除 node_modules 重新安装
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

#### 3. Tauri 开发服务器无法启动
```bash
# 检查端口占用
lsof -i :5173
netstat -an | grep 5173

# 使用不同端口
pnpm dev --port 5174

# 检查 Tauri 信息
pnpm tauri info
```

#### 4. 平台特定问题

##### macOS
```bash
# 如果遇到签名问题
export APPLE_DEVELOPMENT_TEAM=your_team_id
export APPLE_ID=your_apple_id

# 安装额外的系统库
brew install cmake pkg-config
```

##### Windows
```powershell
# 如果 Visual Studio Build Tools 有问题
# 重新安装并确保包含 C++ 构建工具

# 检查环境变量
echo $env:PATH
```

##### Linux
```bash
# 如果缺少系统库
sudo apt update
sudo apt install --fix-missing -y build-essential

# 检查 WebKit 依赖
pkg-config --libs webkit2gtk-4.0
```

### 5. 性能调优

#### 开发环境优化
```bash
# 使用 Rust 的快速编译模式
export RUSTFLAGS="-C opt-level=0"

# 并行编译
export CARGO_BUILD_JOBS=4

# 启用增量编译
export CARGO_INCREMENTAL=1
```

#### 内存优化
```bash
# 限制 Node.js 内存使用
export NODE_OPTIONS="--max-old-space-size=4096"

# 启用 pnpm 磁盘缓存
pnpm config set store-dir ~/.pnpm-store
```

## 📚 学习资源

### 官方文档
- [Tauri 官方文档](https://tauri.app/v1/guides/)
- [Rust 官方教程](https://doc.rust-lang.org/book/)
- [React 官方文档](https://react.dev/)
- [Vite 官方文档](https://vitejs.dev/)

### 推荐教程
- [Tauri 入门教程](https://tauri.app/v1/guides/getting-started/prerequisites)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Modern React 开发](https://react.dev/learn)

### 社区资源
- [Tauri Discord](https://discord.gg/tauri)
- [Rust 用户论坛](https://users.rust-lang.org/)
- [GitHub Discussions](https://github.com/tauri-apps/tauri/discussions)

## 🔄 持续集成配置

### GitHub Actions 配置

创建 `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - name: Setup Rust
      uses: dtolnay/rust-toolchain@stable
      
    - name: Install dependencies
      run: |
        sudo apt-get update
        sudo apt-get install -y libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
        
    - name: Install pnpm
      run: npm install -g pnpm
      
    - name: Install frontend dependencies
      run: pnpm install
      
    - name: Run tests
      run: |
        pnpm lint
        pnpm type-check
        pnpm test
        
    - name: Build application
      run: pnpm tauri build
```

通过这个详细的开发环境配置指南，开发者可以快速搭建完整的 FlyCut Caption 开发环境，并掌握日常开发工作流程。