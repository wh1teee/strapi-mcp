# Publishing to Cline MCP Marketplace

This guide provides instructions for publishing the Strapi MCP server to the Cline MCP Marketplace, making it available for all Cline users to install with a single click.

## Prerequisites

Before submitting to the marketplace, ensure:

1. Your MCP server is fully tested and working correctly
2. You have a GitHub account (for submission)
3. You have prepared a high-quality icon image
4. You have written a clear, concise description of your MCP server

## Preparing Your Package

### 1. Create a GitHub Repository

First, create a public GitHub repository for your MCP server:

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Create a new repository on GitHub and push
git remote add origin https://github.com/yourusername/strapi-mcp.git
git branch -M main
git push -u origin main
```

### 2. Create a Logo/Icon

Create a square icon (recommended size: 512x512 pixels) that represents your Strapi MCP server. The icon should be:

- Simple and recognizable
- Related to both Strapi and the functionality provided
- High contrast with a clean background
- Saved in PNG or JPG format

### 3. Prepare Your Package Metadata

Update your `package.json` file to include comprehensive metadata:

```json
{
  "name": "strapi-mcp",
  "version": "0.1.0",
  "description": "An MCP server for your Strapi CMS that provides access to content types and entries through the MCP protocol",
  "keywords": ["strapi", "cms", "content-management", "mcp", "headless-cms"],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/strapi-mcp.git"
  },
  "homepage": "https://github.com/yourusername/strapi-mcp#readme",
  "bugs": {
    "url": "https://github.com/yourusername/strapi-mcp/issues"
  }
}
```

### 4. Create a Marketplace Manifest

Create a `marketplace.json` file in the root of your project:

```json
{
  "name": "Strapi CMS",
  "shortDescription": "Integrate with Strapi CMS to manage content types and entries",
  "longDescription": "This MCP server integrates with Strapi CMS to provide access to content types and entries through the MCP protocol. It enables AI assistants to create, read, update, and delete content in your Strapi instance, with support for filtering, pagination, sorting, and media uploads.",
  "iconUrl": "https://raw.githubusercontent.com/yourusername/strapi-mcp/main/icon.png",
  "categories": ["content-management", "cms", "database"],
  "tags": ["strapi", "headless-cms", "content-api"],
  "installInstructions": "See DEPLOYMENT.md for detailed installation instructions",
  "environmentVariables": [
    {
      "name": "STRAPI_URL",
      "description": "URL of your Strapi instance (defaults to http://localhost:1337)",
      "required": false
    },
    {
      "name": "STRAPI_API_TOKEN",
      "description": "Your Strapi API token for authentication",
      "required": true
    },
    {
      "name": "STRAPI_DEV_MODE",
      "description": "Set to 'true' to enable development mode features (defaults to false)",
      "required": false
    }
  ],
  "examples": [
    {
      "title": "List Content Types",
      "description": "Get all available content types in your Strapi instance",
      "code": "use_mcp_tool(\n  server_name: \"strapi-mcp\",\n  tool_name: \"list_content_types\",\n  arguments: {}\n)"
    },
    {
      "title": "Get Filtered Entries",
      "description": "Get entries with filtering, pagination, and sorting",
      "code": "use_mcp_tool(\n  server_name: \"strapi-mcp\",\n  tool_name: \"get_entries\",\n  arguments: {\n    \"contentType\": \"api::article.article\",\n    \"filters\": {\n      \"title\": {\n        \"$contains\": \"hello\"\n      }\n    },\n    \"pagination\": {\n      \"page\": 1,\n      \"pageSize\": 10\n    },\n    \"sort\": [\"createdAt:desc\"]\n  }\n)"
    }
  ]
}
```

## Submission Process

### 1. Publish to npm (Optional but Recommended)

Publishing to npm makes your package easier to install:

```bash
# Login to npm
npm login

# Publish package
npm publish
```

### 2. Submit to Cline MCP Marketplace

To submit your MCP server to the Cline MCP Marketplace:

1. Go to the [Cline MCP Marketplace submission form](https://cline.bot/mcp-marketplace/submit) (Note: This is a hypothetical URL; check the actual submission process on the Cline website)

2. Fill out the submission form with:
   - GitHub repository URL
   - npm package name (if published)
   - Contact information
   - Any additional notes for the review team

3. Upload your icon if not already included in your repository

4. Submit your application

### 3. Review Process

After submission, the Cline team will review your MCP server for:

- Functionality and reliability
- Code quality and security
- Documentation quality
- Adherence to marketplace guidelines

This process typically takes 1-2 weeks. You may receive feedback or requests for changes during this time.

## Marketplace Listing Best Practices

To create an effective marketplace listing:

### Icon Design

- Use a simple, recognizable design
- Include elements that represent both Strapi and the functionality
- Use high contrast colors
- Avoid small text or complex details

### Description

- Start with a clear, concise summary (1-2 sentences)
- Explain the key features and benefits
- Include use cases and examples
- Mention any limitations or requirements

### Categories and Tags

- Choose relevant categories that match your MCP server's functionality
- Use specific tags that potential users might search for

### Examples

- Provide clear, practical examples of how to use your MCP server
- Include examples for all major features
- Make examples easy to copy and use

## Maintaining Your Listing

After your MCP server is published:

1. Respond promptly to user feedback and issues
2. Keep your package updated with new features and bug fixes
3. Update your marketplace listing when significant changes are made
4. Monitor usage statistics and user feedback to improve your MCP server

## Resources

- [Cline MCP Documentation](https://cline.bot/docs/mcp) (hypothetical link)
- [MCP Server Development Guide](https://cline.bot/docs/mcp/development) (hypothetical link)
- [Marketplace Guidelines](https://cline.bot/docs/mcp/marketplace) (hypothetical link)
