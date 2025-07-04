# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

- `npm run build` - Compile TypeScript to build/ directory and make executable
- `npm run prepare` - Same as build, runs automatically on npm install
- `npm run watch` - Watch mode compilation for development
- `npm run inspector` - Launch MCP Inspector for debugging at http://localhost:3000
- `npm run generate-test-image` - Generate test images for development

## Architecture Overview

This is a **Model Context Protocol (MCP) server** for Strapi CMS integration. The codebase follows MCP SDK patterns:

### Core Structure
- **src/index.ts** - Main MCP server implementation (~1400 lines)
- **build/index.js** - Compiled executable (#!/usr/bin/env node)
- **src/types.d.ts** - TypeScript type definitions

### MCP Server Architecture
The server implements the MCP specification with:
- **Resources** - Strapi content types exposed as `strapi://content-type/` URIs
- **Tools** - 25+ tools for CRUD operations, media upload, schema management
- **Error Handling** - Extended error codes (ResourceNotFound, AccessDenied)

### Key Integration Points
- **Authentication** - API token-based authentication
- **Performance** - 95% smaller responses with optimized field selection
- **Media Upload** - Direct file path and URL upload (absolute paths required)
- **Content Management** - Full CRUD with relations, filtering, pagination
- **Schema Management** - Content type and component management
- **Strapi v5+ Support** - documentId compatibility alongside legacy id

## Environment Configuration

Required environment variables:
- `STRAPI_URL` - Strapi instance URL (default: http://localhost:1337)
- `STRAPI_API_TOKEN` - Required for authentication
- `STRAPI_DEV_MODE` - Enable development features

## Testing and Debugging

- Use `npm run inspector` to debug MCP communication via browser interface
- Test scripts are in root directory (test-*.sh, test-*.cjs)
- MCP servers communicate over stdio, making debugging challenging without Inspector

## Important Implementation Details

### Article Creation Requirements
- `description` field limited to 80 characters
- Use `cover` field (not `coverImage`) for cover images
- SEO data goes in `blocks` array with `__component: "shared.seo"`

### Media Upload Patterns
- `upload_media_from_path` requires absolute paths (no relative/tilde paths)
- `upload_media_from_url` for remote file downloads
- Both support alt text and metadata for SEO/accessibility

### Error Handling Strategy
- Validates configuration on startup (detects placeholder tokens)
- Connection testing before operations
- Distinguishes between empty collections vs actual errors
- Comprehensive troubleshooting guidance in error messages

### Performance Optimizations
- **95% response size reduction** for content queries (15KB+ → <1KB)
- **12x faster data transfer** with smart field selection
- **Targeted populate** strategies to minimize relation overhead
- **Efficient author lookup** without full content populate
- **Schema-only endpoints** for structure analysis
- 99.9% reduction in context token usage for media uploads (vs base64)
- Efficient streaming for file uploads
- Pagination and filtering support for large datasets

### New Optimized Methods (v0.3.0)
- `get_lightweight_entries` - Essential fields only, massive size reduction
- `find_author_by_name` - Fast author search without populate overhead
- `get_schema_fields` - Enhanced schema analysis without content
- `get_content_preview` - Smart preview with configurable limits