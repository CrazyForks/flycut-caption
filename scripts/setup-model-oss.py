#!/usr/bin/env python3
"""
一键脚本：下载模型文件并上传到阿里云 OSS
使用方法: python3 scripts/setup-model-oss.py
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# 检查并导入 OSS SDK
try:
    import oss2
except ImportError:
    print("❌ 未安装 ali-oss，正在安装...")
    os.system("pip install oss2")
    import oss2

MODEL_NAME = "onnx-community/whisper-small"
OUTPUT_DIR = Path("./models/whisper-small")

# 需要上传到 OSS 的文件列表（仅保留运行所需文件）
FILES_TO_UPLOAD = [
    {
        "local_path": "config.json",
        "oss_path": "config.json",
        "required": True,
        "description": "模型配置文件"
    },
    {
        "local_path": "generation_config.json",
        "oss_path": "generation_config.json",
        "required": True,
        "description": "解码配置文件"
    },
    {
        "local_path": "tokenizer.json",
        "oss_path": "tokenizer.json",
        "required": True,
        "description": "Tokenizer 文件"
    },
    {
        "local_path": "tokenizer_config.json",
        "oss_path": "tokenizer_config.json",
        "required": True,
        "description": "Tokenizer 配置文件"
    },
    {
        "local_path": "special_tokens_map.json",
        "oss_path": "special_tokens_map.json",
        "required": True,
        "description": "特殊 Token 配置"
    },
    {
        "local_path": "preprocessor_config.json",
        "oss_path": "preprocessor_config.json",
        "required": True,
        "description": "预处理器配置"
    },
    {
        "local_path": "onnx/encoder_model.onnx",
        "oss_path": "onnx/encoder_model.onnx",
        "required": True,
        "description": "编码器模型（WebGPU/WASM 需要）"
    },
    {
        "local_path": "onnx/decoder_model_merged_q4.onnx",
        "oss_path": "onnx/decoder_model_merged_q4.onnx",
        "required": True,
        "description": "量化解码器模型（q4，WebGPU 使用）"
    },
    {
        "local_path": "onnx/decoder_model_merged_quantized.onnx",
        "oss_path": "onnx/decoder_model_merged_quantized.onnx",
        "required": True,
        "description": "量化解码器模型（quantized，WASM q8 使用）"
    },
]

def check_hf_cli():
    """检查 Hugging Face CLI 是否已安装"""
    if shutil.which('hf'):
        return True
    return False

def install_hf_cli():
    """安装 Hugging Face CLI"""
    print("📦 正在安装 Hugging Face CLI...")
    try:
        result = subprocess.run(
            ['bash', '-c', 'curl -LsSf https://hf.co/cli/install.sh | bash'],
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Hugging Face CLI 安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Hugging Face CLI 安装失败: {e}")
        print("请手动安装: curl -LsSf https://hf.co/cli/install.sh | bash")
        return False

def download_model_with_hf_cli(model_name: str, output_dir: Path, files_to_download):
    """使用 Hugging Face CLI 下载模型（仅下载需要的文件）"""
    print(f"\n📥 使用 Hugging Face CLI 下载模型: {model_name}")
    print(f"   输出目录: {output_dir}")
    
    # 检查是否已下载
    if output_dir.exists() and any(output_dir.iterdir()):
        print(f"   ⏭️  模型目录已存在，跳过下载")
        print(f"   💡 如需重新下载，请删除目录: {output_dir}")
        return True
        
    try:
        # 只下载需要的文件
        include_patterns = [item["local_path"] for item in files_to_download]
        print(f"   仅下载文件: {', '.join(include_patterns)}")

        # 使用 hf download 命令下载模型
        cmd = ['hf', 'download', model_name, '--local-dir', str(output_dir)]
        for pattern in include_patterns:
            cmd.extend(['--include', pattern])
        print(f"   执行命令: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=False,
            text=True
        )
        
        print(f"\n   ✅ 模型下载完成: {output_dir}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n   ❌ 下载失败: {e}")
        return False
    except FileNotFoundError:
        print(f"\n   ❌ Hugging Face CLI 未找到")
        print(f"   正在尝试安装...")
        if install_hf_cli():
            # 重新尝试下载
            return download_model_with_hf_cli(model_name, output_dir, files_to_download)
        return False

def upload_to_oss(local_path: Path, oss_path: str, oss_client, bucket_name: str):
    """上传文件到 OSS"""
    try:
        file_size_mb = local_path.stat().st_size / 1024 / 1024
        print(f"   📤 上传中 ({file_size_mb:.1f}MB)...", end='', flush=True)
        
        oss_client.put_object_from_file(oss_path, str(local_path))
        
        print(f" ✅")
        return True
    except Exception as e:
        print(f" ❌ 失败: {e}")
        return False

def get_oss_config():
    """获取 OSS 配置"""
    # 从环境变量读取配置，不硬编码敏感信息
    config = {
        'access_key_id': os.getenv('OSS_ACCESS_KEY_ID'),
        'access_key_secret': os.getenv('OSS_ACCESS_KEY_SECRET'),
        'endpoint': os.getenv('OSS_ENDPOINT', 'oss-cn-hangzhou.aliyuncs.com'),
        'bucket_name': os.getenv('OSS_BUCKET_NAME') or os.getenv('OSS_BUCKET'),
    }
    
    # 如果环境变量未设置，提示用户输入
    if not config['access_key_id']:
        print("\n" + "=" * 60)
        print("需要配置阿里云 OSS 信息")
        print("=" * 60)
        print("💡 提示: 建议使用环境变量设置敏感信息，避免在代码中硬编码")
        print("   例如: export OSS_ACCESS_KEY_ID='your-key-id'")
        print("=" * 60)
        config['access_key_id'] = input("请输入 AccessKey ID: ").strip()
        config['access_key_secret'] = input("请输入 AccessKey Secret: ").strip()
        config['bucket_name'] = input("请输入 Bucket 名称: ").strip()
        endpoint_input = input("请输入地域端点 (默认: oss-cn-hangzhou.aliyuncs.com): ").strip()
        if endpoint_input:
            config['endpoint'] = endpoint_input
    
    if not all([config['access_key_id'], config['access_key_secret'], config['bucket_name']]):
        print("\n❌ 错误: OSS 配置不完整")
        print("\n可以通过环境变量设置:")
        print("  export OSS_ACCESS_KEY_ID='your-key-id'")
        print("  export OSS_ACCESS_KEY_SECRET='your-key-secret'")
        print("  export OSS_BUCKET_NAME='your-bucket-name'")
        print("  export OSS_ENDPOINT='oss-cn-hangzhou.aliyuncs.com'")
        print("\n或者运行脚本时手动输入（不推荐，敏感信息会显示在终端）")
        sys.exit(1)
    
    return config


def main():
    print("=" * 60)
    print("Whisper Small 模型一键部署到阿里云 OSS")
    print("=" * 60)
    
    # 步骤 1: 下载模型文件
    print("\n【步骤 1/3】下载模型文件")
    print("-" * 60)
    print(f"模型: {MODEL_NAME}")
    print(f"输出目录: {OUTPUT_DIR}")
    
    # 检查 Hugging Face CLI
    if not check_hf_cli():
        print("⚠️  Hugging Face CLI 未安装")
        if not install_hf_cli():
            print("\n❌ 无法安装 Hugging Face CLI，请手动安装:")
            print("   curl -LsSf https://hf.co/cli/install.sh | bash")
            sys.exit(1)
    
    # 使用 Hugging Face CLI 下载模型
    if not download_model_with_hf_cli(MODEL_NAME, OUTPUT_DIR, FILES_TO_UPLOAD):
        print("\n❌ 模型下载失败")
        sys.exit(1)
    
    print(f"\n✅ 模型下载完成")
    
    # 步骤 2: 配置 OSS
    print("\n【步骤 2/3】配置阿里云 OSS")
    print("-" * 60)
    oss_config = get_oss_config()
    
    # 解析地域
    endpoint = oss_config['endpoint']
    if endpoint.startswith('oss-'):
        region = endpoint.replace('oss-', '').replace('.aliyuncs.com', '')
    else:
        region = 'cn-hangzhou'
    
    # 创建 OSS 客户端
    auth = oss2.Auth(oss_config['access_key_id'], oss_config['access_key_secret'])
    bucket = oss2.Bucket(auth, f'https://{endpoint}', oss_config['bucket_name'])
    
    # 测试连接
    try:
        print("🔍 测试 OSS 连接...", end='', flush=True)
        bucket.get_bucket_info()
        print(" ✅")
    except Exception as e:
        print(f" ❌")
        print(f"❌ OSS 连接失败: {e}")
        print("\n请检查:")
        print("  1. AccessKey ID 和 Secret 是否正确")
        print("  2. Bucket 名称是否正确")
        print("  3. 地域端点是否正确")
        print("  4. Bucket 是否存在且有访问权限")
        sys.exit(1)
    
    # 步骤 3: 上传文件
    print("\n【步骤 3/3】上传文件到 OSS")
    print("-" * 60)
    oss_prefix = "models/onnx-community/whisper-small/"
    
    upload_success = 0
    upload_fail = 0
    
    # 先列出实际下载的文件（用于调试）
    print("\n📋 检查下载的文件...")
    if OUTPUT_DIR.exists():
        onnx_dir = OUTPUT_DIR / "onnx"
        if onnx_dir.exists():
            onnx_files = list(onnx_dir.glob("*.onnx"))
            print(f"   找到 {len(onnx_files)} 个 ONNX 文件:")
            for f in sorted(onnx_files):
                size_mb = f.stat().st_size / 1024 / 1024
                print(f"     - {f.name} ({size_mb:.1f}MB)")
    
    for file_info in FILES_TO_UPLOAD:
        local_path = OUTPUT_DIR / file_info["local_path"]
        oss_path = f"{oss_prefix}{file_info['oss_path']}"
        
        if not local_path.exists():
            if file_info["required"]:
                print(f"\n❌ 必需文件不存在: {local_path}")
                print(f"   💡 请检查模型是否完整下载")
                print(f"   💡 如果文件名不同，请检查 Hugging Face 上的实际文件名")
                sys.exit(1)
            else:
                print(f"\n⚠️  可选文件不存在，跳过: {file_info['local_path']}")
                continue
        
        print(f"\n📤 上传: {file_info['local_path']}")
        print(f"   OSS 路径: {oss_path}")
        
        success = upload_to_oss(local_path, oss_path, bucket, oss_config['bucket_name'])
        
        if success:
            upload_success += 1
        else:
            upload_fail += 1
            if file_info["required"]:
                print(f"\n❌ 必需文件上传失败")
                sys.exit(1)
    
    print(f"\n✅ 上传完成: {upload_success} 个文件")
    if upload_fail > 0:
        print(f"⚠️  失败: {upload_fail} 个可选文件")
    
    # 完成提示
    oss_base_url = f"https://{oss_config['bucket_name']}.{endpoint}"
    print("\n" + "=" * 60)
    print("🎉 部署完成！")
    print("=" * 60)
    print(f"\n📁 模型文件已上传到 OSS:")
    print(f"   基础路径: {oss_base_url}/{oss_prefix}")
    print(f"   示例文件: {oss_base_url}/{oss_prefix}config.json")
    print(f"\n🚀 下一步:")
    print(f"   1. 确保 OSS Bucket 已配置 CORS（允许跨域访问）")
    print(f"   2. 代码中已配置 OSS 模型地址，可直接使用")
    print(f"   3. 重启开发服务器: pnpm dev")
    print(f"   4. 查看浏览器控制台确认模型加载成功")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  操作被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
