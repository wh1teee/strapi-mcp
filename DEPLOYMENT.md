# Deploying and Testing the Strapi MCP Server

This guide provides step-by-step instructions for deploying and testing the Strapi MCP server with Claude.

## Prerequisites

Before you begin, ensure you have:

1. A running Strapi instance (local or remote)
2. A Strapi API token with appropriate permissions
3. Node.js (v16 or higher) installed
4. Claude Desktop app installed (or another MCP-compatible environment)

## Step 1: Build the MCP Server

1. Clone or download the strapi-mcp repository:
   ```bash
   git clone https://github.com/yourusername/strapi-mcp.git
   cd strapi-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the server:
   ```bash
   npm run build
   ```

## Step 2: Configure Your Strapi Instance

1. Log in to your Strapi admin panel
2. Go to Settings > API Tokens
3. Click "Create new API Token"
4. Set a name (e.g., "MCP Integration"), description, and token type (preferably "Full access")
5. Copy the generated token (you'll need it for the MCP configuration)

## Step 3: Configure the MCP Server

### For Claude Desktop

1. Open a text editor and create or edit the Claude Desktop configuration file:
   - On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

2. Add the strapi-mcp server configuration:
   ```json
   {
     "mcpServers": {
       "strapi-mcp": {
         "command": "/absolute/path/to/strapi-mcp/build/index.js",
         "env": {
           "STRAPI_URL": "http://localhost:1337",
           "STRAPI_API_TOKEN": "your-api-token-here",
           "STRAPI_DEV_MODE": "false"
         }
       }
     }
   }
   ```

3. Replace the following values:
   - `/absolute/path/to/strapi-mcp/build/index.js`: The absolute path to the built index.js file
   - `http://localhost:1337`: Your Strapi instance URL
   - `your-api-token-here`: The API token you generated in Step 2
   - Set `STRAPI_DEV_MODE` to `"true"` if you're using Strapi in development mode

### For Claude in VSCode

1. Open VSCode settings:
   - On macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

2. Add the strapi-mcp server configuration (similar to the Claude Desktop configuration)

## Step 4: Test the MCP Server

1. Start your Strapi instance:
   ```bash
   cd /path/to/your/strapi/project
   npm run develop
   ```

2. Launch Claude Desktop or Claude in VSCode

3. Test listing content types:
   ```
   Can you list all the content types in my Strapi instance?
   ```

4. Test getting entries:
   ```
   Can you show me all entries for the [content-type-name] content type?
   ```

5. Test creating an entry:
   ```
   Create a new [content-type-name] with the following data: [your-data-here]
   ```

6. Test updating an entry:
   ```
   Update the [content-type-name] with ID [id] to have the following data: [your-data-here]
   ```

7. Test deleting an entry:
   ```
   Delete the [content-type-name] with ID [id]
   ```

8. Test uploading media:
   ```bash
   # Generate a test image
   cd /path/to/strapi-mcp
   npm run generate-test-image
   ```
   
   Then use the generated base64 data with Claude:
   ```
   Upload this image to my Strapi instance: [paste-base64-encoded-image-data]
   ```

## Step 5: Debugging

If you encounter issues:

1. Check the Claude logs for error messages
2. Use the MCP Inspector to debug the server:
   ```bash
   cd /path/to/strapi-mcp
   npm run inspector
   ```
   This will provide a URL to access debugging tools in your browser.

3. Common issues:
   - Incorrect path to the index.js file
   - Invalid API token
   - Strapi instance not running
   - Network connectivity issues
   - Permission issues with the API token

## Example Test Commands

Here are some example commands you can use to test the MCP server with Claude:

```
Use the strapi-mcp tool to list all content types in my Strapi instance.
```

```
Use the strapi-mcp tool to get all articles from my Strapi instance.
```

```
Use the strapi-mcp tool to create a new article with the title "Test Article" and content "This is a test article created via MCP".
```

```
Use the strapi-mcp tool to update the article with ID 1 to have the title "Updated Article".
```

```
Use the strapi-mcp tool to delete the article with ID 1.
```

## Advanced Testing

For more advanced testing, you can use the MCP server with filtering, pagination, and sorting:

```
Use the strapi-mcp tool to get articles with the title containing "test", sorted by creation date in descending order, and limited to 10 results per page.
```

This would translate to using the `get_entries` tool with the following arguments:

```json
{
  "contentType": "api::article.article",
  "filters": {
    "title": {
      "$contains": "test"
    }
  },
  "pagination": {
    "page": 1,
    "pageSize": 10
  },
  "sort": ["createdAt:desc"]
}
```
