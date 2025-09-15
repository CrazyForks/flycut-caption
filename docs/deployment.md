# FlyCut Caption 部署指南

## 📦 部署概览

本文档详细说明 FlyCut Caption 桌面应用的构建、打包、分发和更新流程。

## 🎯 支持平台

### 主要目标平台
- **Windows**: Windows 10 1903+ (64-bit)
- **macOS**: macOS 10.15+ (Intel & Apple Silicon)
- **Linux**: Ubuntu 18.04+, CentOS 7+, Debian 10+

### 包格式支持
- **Windows**: MSI, NSIS Installer, Portable EXE
- **macOS**: DMG, APP Bundle
- **Linux**: AppImage, DEB, RPM, TAR.GZ

## 🏗️ 构建配置

### Tauri 配置文件

```json
{
  "package": {
    "productName": "FlyCut Caption",
    "version": "1.0.0"
  },
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist",
    "withGlobalTauri": false
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": [
          "$APPDATA",
          "$AUDIO", 
          "$VIDEO",
          "$DESKTOP",
          "$DOCUMENT",
          "$DOWNLOAD"
        ]
      },
      "dialog": {
        "all": true
      },
      "shell": {
        "all": false,
        "open": true
      },
      "notification": {
        "all": true
      },
      "globalShortcut": {
        "all": true
      },
      "updater": {
        "all": true
      },
      "window": {
        "all": false,
        "close": true,
        "hide": true,
        "show": true,
        "maximize": true,
        "minimize": true,
        "unmaximize": true,
        "unminimize": true,
        "startDragging": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.flycut.caption",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png", 
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "copyright": "© 2024 FlyCut Caption",
      "category": "Productivity",
      "shortDescription": "智能视频字幕裁剪工具",
      "longDescription": "FlyCut Caption 是一个基于 AI 的智能视频字幕裁剪工具，支持自动语音识别、可视化字幕编辑和高效视频导出。",
      "resources": [
        "resources/*",
        "models/*"
      ],
      "externalBin": [
        "binaries/ffmpeg",
        "binaries/ffprobe"
      ],
      "deb": {
        "depends": [
          "libwebkit2gtk-4.0-37",
          "libgtk-3-0",
          "libayatana-appindicator3-1"
        ]
      },
      "macOS": {
        "frameworks": [],
        "minimumSystemVersion": "10.15",
        "entitlements": "entitlements.plist",
        "signingIdentity": null
      },
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      },
      "updater": {
        "active": true,
        "endpoints": [
          "https://releases.flycut-caption.com/{{target}}/{{current_version}}"
        ],
        "dialog": true,
        "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUbkJvOHpsK3pFcFczUzFGV08yZEJhRGhtblIzeXJCWmcwZDB3emwrQmhxc2wvQXVQUmJUZzQ3NDIzYnU4PSoK"
      }
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "FlyCut Caption",
        "label": "main",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "maximized": false,
        "visible": true,
        "decorations": true,
        "alwaysOnTop": false,
        "fullscreen": false,
        "skipTaskbar": false
      }
    ],
    "systemTray": {
      "iconPath": "icons/tray.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false
    }
  }
}
```

### 构建脚本配置

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:debug": "tauri build --debug",
    "build:all": "tauri build --target all",
    "build:windows": "tauri build --target x86_64-pc-windows-msvc",
    "build:macos": "tauri build --target x86_64-apple-darwin",
    "build:macos-arm": "tauri build --target aarch64-apple-darwin", 
    "build:linux": "tauri build --target x86_64-unknown-linux-gnu",
    "sign:windows": "node scripts/sign-windows.js",
    "sign:macos": "node scripts/sign-macos.js",
    "release": "node scripts/release.js"
  }
}
```

## 🔧 构建环境配置

### Windows 构建环境

```powershell
# 安装必需工具
winget install Microsoft.VisualStudio.2022.BuildTools
winget install Git.Git
winget install OpenJS.NodeJS
winget install Rustlang.Rustup

# 安装 Tauri CLI
cargo install tauri-cli

# 配置签名证书 (可选)
$env:WINDOWS_CERTIFICATE = "path/to/certificate.p12"
$env:WINDOWS_CERTIFICATE_PASSWORD = "certificate_password"

# 构建应用
pnpm install
pnpm tauri build
```

### macOS 构建环境

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装必需工具
brew install node pnpm rust

# 安装 Tauri CLI
cargo install tauri-cli

# 配置代码签名 (可选)
export APPLE_CERTIFICATE="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_CERTIFICATE_PASSWORD="certificate_password"
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your_team_id"

# 构建应用
pnpm install
pnpm tauri build
```

### Linux 构建环境

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# 安装 Node.js 和 pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 安装 Tauri CLI
cargo install tauri-cli

# 构建应用
pnpm install
pnpm tauri build
```

## 🚀 持续集成/持续部署

### GitHub Actions 工作流

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'
            args: '--target aarch64-apple-darwin'
          - platform: 'macos-latest' 
            args: '--target x86_64-apple-darwin'
          - platform: 'ubuntu-20.04'
            args: ''
          - platform: 'windows-latest'
            args: ''

    runs-on: ${{ matrix.platform }}
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-20.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev

      - name: Rust setup
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Sync node version and setup cache
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install frontend dependencies
        run: pnpm install

      - name: Build the app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'FlyCut Caption ${{ github.ref_name }}'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}

  # 发布到其他平台
  publish-winget:
    needs: build
    runs-on: windows-latest
    steps:
      - name: Publish to Winget
        run: |
          # Winget 包发布脚本
          echo "Publishing to Winget..."

  publish-homebrew:
    needs: build
    runs-on: macos-latest 
    steps:
      - name: Publish to Homebrew
        run: |
          # Homebrew 包发布脚本
          echo "Publishing to Homebrew..."

  publish-flatpak:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Publish to Flatpak
        run: |
          # Flatpak 包发布脚本
          echo "Publishing to Flatpak..."
```

## 🔐 代码签名配置

### macOS 代码签名

```bash
# 创建 entitlements.plist
cat > src-tauri/entitlements.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
EOF

# 配置签名脚本
cat > scripts/sign-macos.js << EOF
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appPath = 'src-tauri/target/release/bundle/macos/FlyCut Caption.app';
const identity = process.env.APPLE_CERTIFICATE;

if (!identity) {
  console.log('No signing identity found, skipping code signing');
  process.exit(0);
}

try {
  // 签名应用
  execSync(\`codesign --force --options runtime --entitlements src-tauri/entitlements.plist --sign "\${identity}" "\${appPath}"\`, { stdio: 'inherit' });
  
  // 公证应用
  if (process.env.APPLE_ID && process.env.APPLE_PASSWORD) {
    const dmgPath = 'src-tauri/target/release/bundle/dmg/FlyCut Caption_1.0.0_x64.dmg';
    execSync(\`xcrun notarytool submit "\${dmgPath}" --apple-id "\${process.env.APPLE_ID}" --password "\${process.env.APPLE_PASSWORD}" --team-id "\${process.env.APPLE_TEAM_ID}" --wait\`, { stdio: 'inherit' });
    execSync(\`xcrun stapler staple "\${dmgPath}"\`, { stdio: 'inherit' });
  }
  
  console.log('macOS app signed and notarized successfully');
} catch (error) {
  console.error('Signing failed:', error);
  process.exit(1);
}
EOF
```

### Windows 代码签名

```javascript
// scripts/sign-windows.js
const { execSync } = require('child_process');
const path = require('path');

const exePath = 'src-tauri/target/release/FlyCut Caption.exe';
const msiPath = 'src-tauri/target/release/bundle/msi/FlyCut Caption_1.0.0_x64_en-US.msi';
const certificate = process.env.WINDOWS_CERTIFICATE;
const password = process.env.WINDOWS_CERTIFICATE_PASSWORD;

if (!certificate) {
  console.log('No certificate found, skipping code signing');
  process.exit(0);
}

try {
  // 签名 EXE
  execSync(`signtool sign /f "${certificate}" /p "${password}" /tr http://timestamp.comodoca.com /td sha256 /fd sha256 "${exePath}"`, { stdio: 'inherit' });
  
  // 签名 MSI
  execSync(`signtool sign /f "${certificate}" /p "${password}" /tr http://timestamp.comodoca.com /td sha256 /fd sha256 "${msiPath}"`, { stdio: 'inherit' });
  
  console.log('Windows binaries signed successfully');
} catch (error) {
  console.error('Signing failed:', error);
  process.exit(1);
}
```

## 📊 自动更新系统

### 更新服务器配置

```javascript
// scripts/update-server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const app = express();
const PORT = process.env.PORT || 3000;

// 更新端点
app.get('/update/:platform/:currentVersion', (req, res) => {
  const { platform, currentVersion } = req.params;
  
  try {
    // 读取最新版本信息
    const releasesPath = path.join(__dirname, 'releases', platform);
    const releases = fs.readdirSync(releasesPath)
      .filter(file => semver.valid(file))
      .sort(semver.rcompare);
    
    const latestVersion = releases[0];
    
    if (!latestVersion || !semver.gt(latestVersion, currentVersion)) {
      return res.status(204).send(); // 无更新
    }
    
    // 返回更新信息
    const updateInfo = {
      version: latestVersion,
      notes: `FlyCut Caption ${latestVersion} 更新日志`,
      pub_date: new Date().toISOString(),
      platforms: {}
    };
    
    // 添加平台特定的下载链接
    const platformFiles = fs.readdirSync(path.join(releasesPath, latestVersion));
    platformFiles.forEach(file => {
      if (file.endsWith('.tar.gz.sig')) {
        const downloadUrl = `https://releases.flycut-caption.com/${platform}/${latestVersion}/${file.replace('.sig', '')}`;
        const signature = fs.readFileSync(path.join(releasesPath, latestVersion, file), 'utf8');
        
        updateInfo.platforms[platform] = {
          signature,
          url: downloadUrl
        };
      }
    });
    
    res.json(updateInfo);
  } catch (error) {
    console.error('Update check failed:', error);
    res.status(500).json({ error: 'Update check failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Update server running on port ${PORT}`);
});
```

### 更新密钥生成

```bash
# 生成更新密钥对
tauri signer generate -w ~/.tauri/myapp.key

# 获取公钥 (添加到 tauri.conf.json)
tauri signer sign -k ~/.tauri/myapp.key
```

## 🚢 发布流程

### 1. 版本发布准备

```bash
# 更新版本号
npm version patch  # 或 minor, major
git push origin main --tags

# 生成更新日志
npx conventional-changelog -p angular -i CHANGELOG.md -s

# 提交更改
git add .
git commit -m "chore: prepare release v1.0.0"
git push origin main
```

### 2. 自动化发布脚本

```javascript
// scripts/release.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const version = process.env.npm_package_version;
const platforms = ['windows', 'macos', 'linux'];

async function release() {
  console.log(`Releasing FlyCut Caption v${version}...`);
  
  try {
    // 构建所有平台
    console.log('Building for all platforms...');
    execSync('pnpm build:all', { stdio: 'inherit' });
    
    // 签名二进制文件
    if (process.platform === 'win32') {
      execSync('pnpm sign:windows', { stdio: 'inherit' });
    } else if (process.platform === 'darwin') {
      execSync('pnpm sign:macos', { stdio: 'inherit' });
    }
    
    // 上传到发布服务器
    console.log('Uploading releases...');
    platforms.forEach(platform => {
      const releaseDir = `src-tauri/target/release/bundle/${platform}`;
      if (fs.existsSync(releaseDir)) {
        // 上传逻辑
        console.log(`Uploaded ${platform} release`);
      }
    });
    
    // 创建 GitHub Release
    console.log('Creating GitHub release...');
    execSync(`gh release create v${version} --generate-notes`, { stdio: 'inherit' });
    
    console.log('Release completed successfully!');
  } catch (error) {
    console.error('Release failed:', error);
    process.exit(1);
  }
}

release();
```

### 3. 包管理器发布

#### Homebrew 发布

```ruby
# Formula/flycut-caption.rb
class FlycutCaption < Formula
  desc "AI-powered video subtitle editing tool"
  homepage "https://flycut-caption.com"
  url "https://github.com/flycut/caption/archive/v1.0.0.tar.gz"
  sha256 "abc123..."
  license "MIT"

  depends_on "node" => :build
  depends_on "rust" => :build
  depends_on "pnpm" => :build

  def install
    system "pnpm", "install"
    system "pnpm", "tauri", "build"
    
    # 安装二进制文件
    bin.install "src-tauri/target/release/flycut-caption"
  end

  test do
    system "#{bin}/flycut-caption", "--version"
  end
end
```

#### Winget 清单

```yaml
# winget-manifest.yaml
PackageIdentifier: FlyCut.Caption
PackageVersion: 1.0.0
PackageLocale: en-US
Publisher: FlyCut
PublisherUrl: https://flycut-caption.com
PackageName: FlyCut Caption
PackageUrl: https://github.com/flycut/caption
License: MIT
ShortDescription: AI-powered video subtitle editing tool
Installers:
- Architecture: x64
  InstallerType: msi
  InstallerUrl: https://github.com/flycut/caption/releases/download/v1.0.0/flycut-caption_1.0.0_x64_en-US.msi
  InstallerSha256: def456...
ManifestType: singleton
ManifestVersion: 1.0.0
```

## 📈 部署监控

### 发布指标追踪

```javascript
// scripts/analytics.js
const fetch = require('node-fetch');

class ReleaseAnalytics {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async trackDownload(platform, version) {
    await fetch('https://analytics.flycut-caption.com/track', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'app_download',
        properties: {
          platform,
          version,
          timestamp: new Date().toISOString()
        }
      })
    });
  }

  async getDownloadStats() {
    const response = await fetch('https://analytics.flycut-caption.com/stats', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    return await response.json();
  }
}
```

### 自动回滚机制

```javascript
// scripts/rollback.js
const { execSync } = require('child_process');

async function rollback(version) {
  console.log(`Rolling back to version ${version}...`);
  
  try {
    // 回滚更新服务器
    execSync(`curl -X POST https://releases.flycut-caption.com/rollback/${version}`, { stdio: 'inherit' });
    
    // 更新 GitHub Release
    execSync(`gh release edit v${version} --prerelease=false`, { stdio: 'inherit' });
    
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
}

// 使用: node scripts/rollback.js 1.0.0
rollback(process.argv[2]);
```

通过这个详细的部署指南，FlyCut Caption 可以实现自动化的跨平台构建、签名、分发和更新，确保用户能够便捷地获取和使用应用程序。