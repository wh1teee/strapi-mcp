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
- `STRAPI_API_TOKEN` (required): Your Strapi API token for authentication
- `STRAPI_DEV_MODE` (optional): Set to "true" to enable development mode features (defaults to false)

### Getting a Strapi API Token

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

### Accessing Resources

```
access_mcp_resource(
  server_name: "strapi-mcp",
  uri: "strapi://content-type/api::article.article"
)
```
