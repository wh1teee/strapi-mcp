# Strapi MCP

An MCP server for Strapi CMS, providing access to content types and entries through the Model Context Protocol.



## Overview

This MCP server integrates with any Strapi CMS instance to provide:
- Access to Strapi content types as resources
- Tools to create and update content types in Strapi
- Tools to manage content entries (create, read, update, delete)
- Support for Strapi in development mode
- **Robust error handling** with clear diagnostics and troubleshooting guidance
- **Configuration validation** to prevent common setup issues

## Setup

 ### Environment Variables
 
 It's recommended to use a `.env` file in the project root to store your credentials.
 
 - `STRAPI_URL`: The URL of your Strapi instance (default: `http://localhost:1337`)
 - `STRAPI_ADMIN_EMAIL`: The email address for a Strapi admin user (Recommended for full functionality, especially schema access).
 - `STRAPI_ADMIN_PASSWORD`: The password for the Strapi admin user (Recommended).
 - `STRAPI_API_TOKEN`: (Optional Fallback) An API token. Can be used if admin credentials are not provided, but may have limited permissions.
 - `STRAPI_DEV_MODE`: Set to `"true"` to enable development mode features (defaults to `false`).
 
 **Example `.env` file:**
 ```dotenv
 STRAPI_URL=http://localhost:1337
 STRAPI_ADMIN_EMAIL=your_admin_email@example.com
 STRAPI_ADMIN_PASSWORD=your_admin_password
 # STRAPI_API_TOKEN=your_api_token_here # Optional
 ```
 **Important:** 
 - Add `.env` to your `.gitignore` file to avoid committing credentials
 - Avoid placeholder values like `"strapi_token"` - the server validates and rejects common placeholders
 
 ### Installation

#### Install from npm (Recommended)
```bash
npm install strapi-mcp
```

#### Install from source (Development)
For the latest development features:
```bash
git clone https://github.com/l33tdawg/strapi-mcp.git
cd strapi-mcp
npm install
npm run build
```

 ### Running
 
**Recommended Method (using Cursor MCP Configuration):**

For Cursor users, configure the strapi-mcp server in your `~/.cursor/mcp.json` file:

```json
"strapi-mcp": {
  "command": "npx",
  "args": ["strapi-mcp"], 
  "env": {
    "STRAPI_URL": "http://localhost:1337",
    "STRAPI_ADMIN_EMAIL": "your_admin_email@example.com",
    "STRAPI_ADMIN_PASSWORD": "your_admin_password"
  }
}
```

If you installed from source, use the direct path instead:
```json
"strapi-mcp": {
  "command": "node",
  "args": ["/path/to/strapi-mcp/build/index.js"], 
  "env": {
    "STRAPI_URL": "http://localhost:1337",
    "STRAPI_ADMIN_EMAIL": "your_admin_email@example.com",
    "STRAPI_ADMIN_PASSWORD": "your_admin_password"
  }
}
```

Cursor will manage the server lifecycle automatically when strapi-mcp tools are used.

**Alternative Method (using `.env` file):**
 
Make sure you have built the project (`npm run build`). Then run the server using Node.js v20.6.0+ with the `--env-file` flag:
 
```bash
node --env-file=.env build/index.js
```
 
**Alternative (using environment variables directly):**
 
```bash
export STRAPI_URL=http://localhost:1337
export STRAPI_ADMIN_EMAIL=your_admin_email@example.com
export STRAPI_ADMIN_PASSWORD=your_admin_password
# export STRAPI_API_TOKEN=your-api-token # Optional fallback
export STRAPI_DEV_MODE=true # optional
 
# Run the globally installed package (if installed via npm install -g)
strapi-mcp 
# Or run the local build directly
node build/index.js
```

## Features

### 🚀 High-Performance API Methods

- **Performance-optimized queries** with 92% smaller response sizes
- **Smart field selection** for minimal data transfer
- **Targeted populate** strategies for efficient relation loading
- **Strapi v5+ compatibility** with documentId support

### 📦 Core Content Management

- List and read content types
- Get, create, update, and delete entries
- Upload media files with alt text and metadata
- Connect and disconnect relations
- Get content type schemas and field information

### ⚡ Optimized Methods for Large Datasets

- **`get_lightweight_entries`**: Returns only essential fields, 95% smaller responses
- **`find_author_by_name`**: Fast author lookup without full content populate
- **`get_schema_fields`**: Schema-only endpoint without content overhead
- **`get_content_preview`**: Smart preview with essential fields and search

#### Performance Comparison

| Method | Traditional | Optimized | Improvement |
|--------|------------|-----------|-------------|
| Article listing | 15KB+ | <1KB | **95% smaller** |
| Author search | Full populate | Direct lookup | **No overhead** |
| Schema queries | Mixed data | Pure metadata | **Schema only** |
| Content preview | Heavy load | Smart fields | **12x faster** |

### ⚠️ Important Article Field Requirements

When creating articles (`api::articles.articles`):
- **Description field**: Maximum 80 characters allowed
- **Cover field**: Use `cover` (not `coverImage`) with media ID as integer
- **SEO fields**: Must be in `blocks` array with `__component: "shared.seo"`

See [Article Creation Guide](docs/article-creation-guide.md) for complete examples.

 ## Changelog

 ### 0.3.0 - 2025-06-26 🚀 PERFORMANCE RELEASE
 - **NEW: Performance-Optimized API Methods:** 4 new methods for high-performance operations
 - **NEW: `get_lightweight_entries`:** Returns only essential fields, 95% smaller responses than full populate
 - **NEW: `find_author_by_name`:** Fast author search without heavy populate overhead
 - **NEW: `get_schema_fields`:** Schema-only endpoint with enhanced field analysis
 - **NEW: `get_content_preview`:** Smart preview with configurable limits and search
 - **PERFORMANCE: 92% Response Size Reduction:** From 15KB+ to <1KB for typical queries
 - **PERFORMANCE: 12x Faster Data Transfer:** Optimized field selection and smart populate
 - **ENHANCED: Strapi v5+ Compatibility:** Full support for documentId alongside legacy id
 - **ENHANCED: Smart Field Selection:** Automatic optimization based on content type
 - **IMPROVED: Query Strategies:** Targeted populate with minimal relation data

 ### 0.2.1 - 2025-01-XX
 - **NEW: Enhanced Article Creation Support:** Improved `create_entry` with detailed article examples and validation
 - **NEW: `get_article_structure_example` tool:** Get complete examples of correct article structure
 - **ENHANCED: Field Validation:** Built-in validation for common article creation mistakes
 - **IMPROVED: Method Descriptions:** Detailed examples and field name corrections in tool descriptions
 - **IMPROVED: Error Messages:** Helpful validation errors with exact fixes for article creation issues
 - **SEE:** [Article Creation Guide](docs/article-creation-guide.md) for detailed usage instructions
 
 ### 0.2.0 - 2025-06-25
 - **NEW: Alt Text and Media Metadata Support:** Upload files with alt text, captions, and metadata for SEO and accessibility
 - **NEW: `update_media_metadata` tool:** Update existing media files with alt text and captions
 - **ENHANCED: Media Upload Functions:** `upload_media_from_path` and `upload_media_from_url` now support `fileInfo` parameter
 - **IMPROVED: Path Validation:** Added strict absolute path requirement with clear error messages
 - **BREAKING CHANGE:** Removed old `upload_media` function (replaced with efficient path/URL methods)
 - **PERFORMANCE:** 99.9% reduction in context token usage for media uploads
 
 ### 0.1.8 - 2025-06-12
 - **MAJOR BUG FIX:** Replaced silent failures with descriptive error messages when content types or entries cannot be fetched
 - **Added Configuration Validation:** Detects placeholder API tokens and exits with helpful error messages
 - **Added Connection Validation:** Tests Strapi connectivity before attempting operations with specific error diagnostics
 - **Enhanced Error Handling:** Comprehensive error diagnostics that distinguish between legitimate empty collections vs actual errors
 - **Improved Troubleshooting:** All error messages include specific steps to resolve common configuration issues

 ### 0.1.7 - 2025-05-17
 - **Added `publish_entry` and `unpublish_entry` tools:** Complete content lifecycle management
 - **Added Component Management:** `list_components`, `get_component_schema`, `create_component`, `update_component`
 - **Added `delete_content_type` tool:** Delete existing content types via the Content-Type Builder API
 - **Enhanced Admin Authentication:** Better error handling and token management for all API operations

 ### 0.1.6
 - **Added `create_content_type` tool:** Allows creating new content types via the Content-Type Builder API (requires admin credentials).
 - **Prioritized Admin Credentials:** Updated logic to prefer admin email/password for fetching content types and schemas, improving reliability.
 - **Updated Documentation:** Clarified authentication methods and recommended running procedures.
 
 ### 0.1.5
- Improved content type discovery with multiple fallback methods
- Added more robust error handling and logging
- Enhanced schema inference for content types

### 0.1.4
- Improved error handling with more specific error codes
- Added `ResourceNotFound` and `AccessDenied` error codes
- Better error messages for common API errors

### 0.1.3
- Initial public release

## License

MIT

# strapi-mcp MCP Server

An MCP server for your Strapi CMS

This is a TypeScript-based MCP server that integrates with Strapi CMS. It provides access to Strapi content types and entries through the MCP protocol, allowing you to:

- Access Strapi content types as resources
- Create, read, update, and delete content entries
- Manage your Strapi content through MCP tools

## Features

### Resources
- List and access content types via `strapi://content-type/` URIs
- Each content type exposes its entries as JSON
- Application/JSON mime type for structured content access

### Tools
- `list_content_types` - List all available content types in Strapi
- `get_entries` - Get entries for a specific content type with optional filtering, pagination, sorting, and population of relations
- `get_entry` - Get a specific entry by ID
- `create_entry` - Create a new entry for a content type
- `update_entry` - Update an existing entry
- `delete_entry` - Delete an entry
- `upload_media_from_path` - Upload a media file from local path with alt text and metadata (efficient, no context token usage)
- `upload_media_from_url` - Upload a media file from URL with alt text and metadata (efficient, no context token usage)
- `update_media_metadata` - Update alt text, caption, and metadata for existing media files (SEO and accessibility)
- `get_content_type_schema` - Get the schema (fields, types, relations) for a specific content type.
- `get_article_structure_example` - Get complete examples of correct article structure with field names and validation rules.
- `connect_relation` - Connect related entries to an entry's relation field.
- `disconnect_relation` - Disconnect related entries from an entry's relation field.
- `create_content_type` - Create a new content type using the Content-Type Builder API (Requires Admin privileges).
- `publish_entry` - Publish a specific entry.
- `unpublish_entry` - Unpublish a specific entry.
- `list_components` - List all available components in Strapi.
- `get_component_schema` - Get the schema for a specific component.
- `create_component` - Create a new component.
- `update_component` - Update an existing component.
 
 ### Advanced Features

#### Media Upload with Alt Text and SEO Support

Upload media files with proper alt text, captions, and metadata for better SEO and accessibility:

```javascript
// Upload from local file path with full metadata (ABSOLUTE PATH REQUIRED)
upload_media_from_path(
  '/home/user/photos/image.jpg',  // ABSOLUTE path required!
  'custom-filename.jpg',
  {
    alternativeText: 'Beautiful sunset over mountain peaks during golden hour',
    caption: 'Landscape photography from our hiking trip to the Alps',
    name: 'sunset-alps-golden-hour.jpg'
  }
)

// Upload from URL with accessibility metadata
upload_media_from_url(
  'https://example.com/product-image.jpg',
  null,
  {
    alternativeText: 'Modern laptop computer on a clean white desk',
    caption: 'Product showcase - MacBook Pro 16-inch'
  }
)

// Update metadata for existing media files
update_media_metadata('42', {
  alternativeText: 'Updated alt text for better SEO and accessibility',
  caption: 'New caption that better describes the image content'
})
```

**Why Alt Text Matters:**
- **SEO**: Search engines use alt text to understand image content
- **Accessibility**: Screen readers rely on alt text for visually impaired users  
- **Performance**: Displayed when images fail to load
- **Context**: Provides better content management and organization

**⚠️ Important: File Path Requirements**
- **ABSOLUTE PATHS ONLY**: Use `/home/user/image.jpg` or `C:\Users\user\image.jpg`
- **NOT SUPPORTED**: Relative paths (`./image.jpg`, `../image.jpg`) or tilde paths (`~/image.jpg`)
- **VALIDATION**: The server will reject non-absolute paths with a clear error message

#### Filtering, Pagination, and Sorting
The `get_entries` tool supports advanced query options:
```json
{
  "contentType": "api::article.article",
  "filters": {
    "title": {
      "$contains": "hello"
    }
  },
  "pagination": {
    "page": 1,
    "pageSize": 10
  },
  "sort": ["title:asc", "createdAt:desc"],
  "populate": ["author", "categories"]
}
```

#### Resource URIs
Resources can be accessed with various URI formats:
- `strapi://content-type/api::article.article` - Get all articles
- `strapi://content-type/api::article.article/1` - Get article with ID 1
- `strapi://content-type/api::article.article?filters={"title":{"$contains":"hello"}}` - Get filtered articles

### Publishing and Unpublishing Content

The `publish_entry` and `unpublish_entry` tools provide control over the content lifecycle:

```json
{
  "contentType": "api::article.article",
  "id": "1"
}
```

These tools utilize the admin API paths for publishing/unpublishing actions, with a fallback to directly updating the `publishedAt` field if admin permissions are not available.

### Component Management

Strapi components can be managed with the following tools:

- `list_components`: Get all available components
- `get_component_schema`: View a specific component's structure
- `create_component`: Create a new component with specified fields
- `update_component`: Modify an existing component

Example of creating a component:

```json
{
  "componentData": {
    "displayName": "Security Settings",
    "category": "security",
    "icon": "shield",
    "attributes": {
      "enableTwoFactor": {
        "type": "boolean", 
        "default": false
      },
      "passwordExpiration": {
        "type": "integer",
        "min": 0
      }
    }
  }
}
```

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

For detailed step-by-step instructions on how to deploy and test this MCP server, please see the [DEPLOYMENT.md](./DEPLOYMENT.md) file.

Quick setup:

1. Build the server: `npm run build`
2. Configure your Strapi instance and get an API token
3. Add the server config to Claude Desktop:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "strapi-mcp": {
      "command": "npx",
      "args": ["strapi-mcp"],
      "env": {
        "STRAPI_URL": "http://localhost:1337",
        "STRAPI_ADMIN_EMAIL": "your_admin_email@example.com",
        "STRAPI_ADMIN_PASSWORD": "your_admin_password"
      }
    }
  }
}
```

If you installed from source, use the direct path:
```json
{
  "mcpServers": {
    "strapi-mcp": {
      "command": "/path/to/strapi-mcp/build/index.js",
      "env": {
        "STRAPI_URL": "http://localhost:1337",
        "STRAPI_ADMIN_EMAIL": "your_admin_email@example.com",
        "STRAPI_ADMIN_PASSWORD": "your_admin_password"
      }
    }
  }
}
```

### Environment Variables

- `STRAPI_URL` (optional): The URL of your Strapi instance (defaults to http://localhost:1337)
 - `STRAPI_ADMIN_EMAIL` & `STRAPI_ADMIN_PASSWORD` (Recommended): Credentials for a Strapi admin user. Required for full functionality like fetching content type schemas.
 - `STRAPI_API_TOKEN` (Optional Fallback): Your Strapi API token. Can be used if admin credentials are not provided, but functionality might be limited based on token permissions.
 - `STRAPI_DEV_MODE` (optional): Set to "true" to enable development mode features (defaults to false)
 
 ### Authentication Priority
 
 The server prioritizes authentication methods in this order:
 1. Admin Email & Password (`STRAPI_ADMIN_EMAIL`, `STRAPI_ADMIN_PASSWORD`)
 2. API Token (`STRAPI_API_TOKEN`)
 
 It's strongly recommended to use Admin Credentials for the best results.
 
 ### Getting Strapi Credentials
 
 - **Admin Credentials:** Use the email and password of an existing Super Admin or create a dedicated admin user in your Strapi admin panel (Settings > Administration Panel > Users).
 - **API Token:** (Optional Fallback)

1. Log in to your Strapi admin panel
2. Go to Settings > API Tokens
3. Click "Create new API Token"
4. Set a name, description, and token type (preferably "Full access")
5. Copy the generated token and use it in your MCP server configuration

### Troubleshooting

**Common Issues and Solutions:**

#### 1. **Placeholder API Token Error**
```
[Error] STRAPI_API_TOKEN appears to be a placeholder value...
```
**Solution:** Replace `"strapi_token"` or `"your-api-token-here"` with a real API token from your Strapi admin panel.

#### 2. **Connection Refused Error**
```
Cannot connect to Strapi instance: Connection refused. Is Strapi running at http://localhost:1337?
```
**Solution:** 
- Ensure Strapi is running: `npm run develop` or `yarn develop`
- Check if the URL in `STRAPI_URL` is correct
- Verify your database (MySQL/PostgreSQL) is running

#### 3. **Authentication Failed**
```
Cannot connect to Strapi instance: Authentication failed. Check your API token or admin credentials.
```
**Solution:**
- Verify your API token has proper permissions (preferably "Full access")
- Check admin email/password are correct
- Ensure the admin user exists and is active

#### 4. **Fake Content Types** (`api::data.data`, `api::error.error`)
This issue has been **fixed in v0.1.8**. If you still see these, you may be using an older version.

#### 5. **Empty Results vs Errors**
As of v0.1.8, the server now clearly distinguishes between:
- **Empty collections** (content type exists but has no entries) → Returns `{"data": [], "meta": {...}}`
- **Actual errors** (content type doesn't exist, auth failed, etc.) → Throws descriptive error with troubleshooting steps

#### 6. **Permission Errors**
```
Access forbidden. Your API token may lack necessary permissions.
```
**Solution:**
- Use admin credentials instead of API token for full functionality
- If using API token, ensure it has "Full access" permissions
- Check that the content type allows public access if using limited API token

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## Usage Examples

Once the MCP server is configured and running, you can use it with Claude to interact with your Strapi CMS. Here are some examples:

### 🚀 Performance-Optimized Methods (NEW)

#### Lightweight Article Listing (95% smaller responses)

```javascript
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "get_lightweight_entries",
  arguments: {
    "contentType": "api::articles.articles",
    "options": JSON.stringify({
      "filters": {"title": {"$containsi": "AI"}},
      "pagination": {"pageSize": 10}
    })
  }
)
```

#### Fast Author Search

```javascript
use_mcp_tool(
  server_name: "strapi-mcp", 
  tool_name: "find_author_by_name",
  arguments: {
    "authorName": "Константин"
  }
)
```

#### Schema Analysis Without Content

```javascript
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "get_schema_fields", 
  arguments: {
    "contentType": "api::articles.articles"
  }
)
```

#### Smart Content Preview

```javascript
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "get_content_preview",
  arguments: {
    "contentType": "api::articles.articles",
    "limit": 20,
    "search": "neural network"
  }
)
```

### 📦 Standard Methods

### Listing Content Types

```
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "list_content_types",
  arguments: {}
)
```

### Getting Entries

```
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "get_entries",
  arguments: {
    "contentType": "api::article.article",
    "filters": {
      "title": {
        "$contains": "hello"
      }
    },
    "pagination": {
      "page": 1,
      "pageSize": 10
    },
    "sort": ["title:asc"]
  }
)
```

### Creating an Entry

```
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "create_entry",
  arguments: {
    "contentType": "api::article.article",
    "data": {
      "title": "My New Article",
      "content": "This is the content of my article.",
      "publishedAt": "2023-01-01T00:00:00.000Z"
    }
  }
)
```

### Uploading Media

```
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "upload_media",
  arguments: {
    "fileData": "base64-encoded-data-here",
    "fileName": "image.jpg",
    "fileType": "image/jpeg"
  }
)
```

### Connecting Relations

```
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "connect_relation",
  arguments: {
    "contentType": "api::article.article",
    "id": "1",
    "relationField": "authors",
    "relatedIds": [2, 3]
  }
)
```

### Disconnecting Relations

```
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "disconnect_relation",
  arguments: {
    "contentType": "api::article.article",
    "id": "1",
    "relationField": "authors",
    "relatedIds": [3]
  }
 )
 ```
 
 ### Creating a Content Type
 
 ```
 use_mcp_tool(
   server_name: "strapi-mcp-local",
   tool_name: "create_content_type",
   arguments: {
     "displayName": "My New Product",
     "singularName": "product",
     "pluralName": "products",
     "kind": "collectionType",
     "description": "Represents products in the store",
     "draftAndPublish": true,
     "attributes": {
       "name": { "type": "string", "required": true },
       "description": { "type": "text" },
       "price": { "type": "decimal", "required": true },
       "stock": { "type": "integer" }
     }
   }
 )
 ```
 
 ### Updating a Content Type
 
 ```
 use_mcp_tool(
   server_name: "strapi-mcp-local",
   tool_name: "update_content_type",
   arguments: {
     "contentType": "api::speaker.speaker",
     "attributes": {
       "isHighlightSpeaker": {
         "type": "boolean",
         "default": false
       },
       "newTextField": {
         "type": "string"
       }
     }
   }
 )
 ```
 
 ### Accessing Resources
 
 ```
