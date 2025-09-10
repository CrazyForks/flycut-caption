# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `pnpm dev` - Starts Vite dev server with HMR
- **Build for production**: `pnpm build` - TypeScript compilation followed by Vite build
- **Lint code**: `pnpm lint` - Run ESLint on the codebase
- **Preview build**: `pnpm preview` - Preview the production build locally
- **Add Shadcn/ui components**: `pnpm dlx shadcn@latest add <component-name>` - Add specific components

## Architecture Overview

This is a React + TypeScript + Vite project with modern UI tooling:

- **Build System**: Vite with React plugin and Tailwind CSS 4 integration
- **Language**: TypeScript with strict configuration using project references
- **UI Framework**: React 19 with functional components and hooks
- **Styling**: Tailwind CSS 4 with Shadcn/ui component library
- **Icons**: Lucide React icons (integrated with Shadcn/ui)
- **Linting**: ESLint with React-specific rules and TypeScript integration
- **Package Manager**: pnpm (evidenced by pnpm-lock.yaml)

## Project Structure

- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles with Tailwind imports and CSS variables
- `src/lib/utils.ts` - Utility functions (includes cn helper for class merging)
- `components.json` - Shadcn/ui configuration file
- `vite.config.ts` - Vite configuration with React plugin, Tailwind, and path aliases
- TypeScript uses project references with separate configs for app and node environments

## Key Configuration Notes

- Uses ES modules (`"type": "module"` in package.json)
- TypeScript project references split between `tsconfig.app.json` and `tsconfig.node.json`
- Path aliases configured: `@/*` maps to `./src/*`
- Shadcn/ui uses "new-york" style with neutral base color
- **Tailwind CSS v4.1.13**: Latest version with CSS-first configuration using `@theme` blocks
- **Zero-config setup**: No `tailwind.config.js` or `postcss.config.js` needed
- Uses `@tailwindcss/vite` plugin for optimal Vite integration
- No test framework currently configured

## UI Component Library

- **Tailwind CSS v4**: CSS-first configuration with `@theme` blocks
- **Vite Integration**: Uses `@tailwindcss/vite` plugin for better performance  
- **Theme system**: Built-in light/dark mode support via CSS variables and `oklch()` colors
- **Shadcn/ui**: Modern React components built on Radix UI primitives
- **Icons**: Lucide React icons integrated throughout components

## Tailwind CSS v4 Features

- **Simplified setup**: Single `@import "tailwindcss"` line in CSS
- **CSS-first config**: Define themes using `@theme` and `@theme dark` blocks
- **Modern colors**: Uses `oklch()` color space for better color consistency
- **Zero dependencies**: No need for PostCSS configuration or external config files
- **Better performance**: Native Vite plugin integration

## FlyCut Caption Application

这是一个智能视频字幕裁剪工具，支持：

### 核心功能
- **文件上传**: 支持视频/音频文件拖拽上传
- **ASR 语音识别**: 基于 Whisper 模型生成字级时间戳字幕
- **字幕编辑**: 可视化选择和删除字幕片段
- **视频播放**: 与字幕同步的视频播放器
- **字幕导出**: 支持 SRT/JSON 格式导出

### 技术架构
- **状态管理**: React Context + useReducer
- **组件化**: 模块化组件设计，清晰的职责分离
- **Web Workers**: ASR 处理在后台线程运行
- **TypeScript**: 完整的类型定义和类型安全

### 项目结构
- `src/components/` - UI 组件（文件上传、视频播放器、字幕编辑器等）
- `src/hooks/` - 自定义 Hooks（ASR、字幕管理等）
- `src/services/` - 业务服务层（ASR 服务等）
- `src/types/` - TypeScript 类型定义
- `src/utils/` - 工具函数（时间、文件、音频处理）
- `src/workers/` - Web Workers（ASR 处理）
- `src/contexts/` - React Context（全局状态管理）