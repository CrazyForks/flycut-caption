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
- Tailwind CSS 4 with CSS variables for theming (light/dark mode support)
- No test framework currently configured

## UI Component Library

- **Shadcn/ui**: Modern React components built on Radix UI primitives
- **Styling approach**: Uses CSS variables with Tailwind classes
- **Theme system**: Built-in light/dark mode support via CSS variables
- **Icons**: Lucide React icons integrated throughout components