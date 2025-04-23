# Strapi MCP

An MCP server for Strapi CMS, providing access to content types and entries through the Model Context Protocol.

## Overview

This MCP server integrates with any Strapi CMS instance to provide:
- Access to Strapi content types as resources
- Tools to create and update content types in Strapi
- Tools to manage content entries (create, read, update, delete)
- Support for Strapi in development mode

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
 **Important:** Add `.env` to your `.gitignore` file to avoid committing credentials.
 
 ### Installation

```bash
npm install strapi-mcp
```

 ### Running
 
 **Recommended Method (using `.env` file):**
 
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

- List and read content types
- Get, create, update, and delete entries
- Upload media files
- Connect and disconnect relations
- Get content type schemas

 ## Changelog
 
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
- `upload_media` - Upload a media file to Strapi
 - `get_content_type_schema` - Get the schema (fields, types, relations) for a specific content type.
 - `connect_relation` - Connect related entries to an entry's relation field.
 - `disconnect_relation` - Disconnect related entries from an entry's relation field.
 - `create_content_type` - Create a new content type using the Content-Type Builder API (Requires Admin privileges).
 
 ### Advanced Features

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
      "command": "/path/to/strapi-mcp/build/index.js",
      "env": {
        "STRAPI_URL": "http://localhost:1337",
        "STRAPI_API_TOKEN": "your-api-token-here",
        "STRAPI_DEV_MODE": "false"
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

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## Usage Examples

Once the MCP server is configured and running, you can use it with Claude to interact with your Strapi CMS. Here are some examples:

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
