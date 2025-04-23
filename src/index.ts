#!/usr/bin/env node

/**
 * Strapi MCP Server
 * 
 * This MCP server integrates with any Strapi CMS instance to provide:
 * - Access to Strapi content types as resources
 * - Tools to create and update content types in Strapi
 * - Tools to manage content entries (create, read, update, delete)
 * - Support for Strapi in development mode
 * 
 * This server is designed to be generic and work with any Strapi instance,
 * regardless of the content types defined in that instance.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
  ReadResourceRequest,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Configuration from environment variables
const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_DEV_MODE = process.env.STRAPI_DEV_MODE === "true";

// Validate required environment variables
if (!STRAPI_API_TOKEN) {
  console.error("[Error] Missing STRAPI_API_TOKEN environment variable");
  process.exit(1);
}

console.error(`[Setup] Connecting to Strapi at ${STRAPI_URL}`);
console.error(`[Setup] Development mode: ${STRAPI_DEV_MODE ? "enabled" : "disabled"}`);

// Axios instance for Strapi API
const strapiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Cache for content types
let contentTypesCache: any[] = [];

/**
 * Create an MCP server with capabilities for resources and tools
 */
const server = new Server(
  {
    name: "strapi-mcp",
    version: "0.2.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Fetch all content types from Strapi
 */
async function fetchContentTypes(): Promise<any[]> {
  try {
    console.error("[API] Fetching content types from Strapi");
    
    // If we have cached content types, return them
    if (contentTypesCache.length > 0) {
      return contentTypesCache;
    }
    
    let endpoint = "/api/content-types";
    
    // If in development mode, use the content-type-builder API
    if (STRAPI_DEV_MODE) {
      endpoint = "/content-type-builder/content-types";
    }
    
    // Get the list of content types from Strapi
    const response = await strapiClient.get(endpoint);
    
    // Filter out internal content types
    const contentTypes = response.data.data.filter((ct: any) => 
      !ct.uid.startsWith("admin::") && 
      !ct.uid.startsWith("plugin::")
    );
    
    // Cache the content types
    contentTypesCache = contentTypes;
    
    return contentTypes;
  } catch (error) {
    console.error("[Error] Failed to fetch content types:", error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to fetch content types: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Interface for query parameters
 */
interface QueryParams {
  filters?: Record<string, any>;
  pagination?: {
    page?: number;
    pageSize?: number;
  };
  sort?: string[];
  populate?: string | string[] | Record<string, any>;
  fields?: string[];
}

/**
 * Fetch entries for a specific content type with optional filtering, pagination, and sorting
 */
async function fetchEntries(contentType: string, queryParams?: QueryParams): Promise<any> {
  try {
    console.error(`[API] Fetching entries for content type: ${contentType}`);
    
    // Extract the collection name from the content type UID
    const collection = contentType.split(".")[1];
    
    // Build query parameters
    const params: Record<string, any> = {};
    
    if (queryParams?.filters) {
      params.filters = queryParams.filters;
    }
    
    if (queryParams?.pagination) {
      params.pagination = queryParams.pagination;
    }
    
    if (queryParams?.sort) {
      params.sort = queryParams.sort;
    }
    
    if (queryParams?.populate) {
      params.populate = queryParams.populate;
    }
    
    if (queryParams?.fields) {
      params.fields = queryParams.fields;
    }
    
    // Get the entries from Strapi
    const response = await strapiClient.get(`/api/${collection}`, {
      params: params
    });
    
    // Return both data and pagination info
    return {
      data: response.data.data || [],
      meta: response.data.meta || {}
    };
  } catch (error) {
    console.error(`[Error] Failed to fetch entries for ${contentType}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to fetch entries for ${contentType}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch a specific entry by ID
 */
async function fetchEntry(contentType: string, id: string, queryParams?: QueryParams): Promise<any> {
  try {
    console.error(`[API] Fetching entry ${id} for content type: ${contentType}`);
    
    // Extract the collection name from the content type UID
    const collection = contentType.split(".")[1];
    
    // Build query parameters only for populate and fields
    const params: Record<string, any> = {};
    if (queryParams?.populate) {
      params.populate = queryParams.populate;
    }
    if (queryParams?.fields) {
      params.fields = queryParams.fields;
    }

    // Get the entry from Strapi
    const response = await strapiClient.get(`/api/${collection}/${id}`, { params });
    
    return response.data.data;
  } catch (error) {
    console.error(`[Error] Failed to fetch entry ${id} for ${contentType}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to fetch entry ${id} for ${contentType}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create a new entry
 */
async function createEntry(contentType: string, data: any): Promise<any> {
  try {
    console.error(`[API] Creating new entry for content type: ${contentType}`);
    
    // Extract the collection name from the content type UID
    const collection = contentType.split(".")[1];
    
    // Create the entry in Strapi
    const response = await strapiClient.post(`/api/${collection}`, {
      data: data
    });
    
    return response.data.data;
  } catch (error) {
    console.error(`[Error] Failed to create entry for ${contentType}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to create entry for ${contentType}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Update an existing entry
 */
async function updateEntry(contentType: string, id: string, data: any): Promise<any> {
  try {
    console.error(`[API] Updating entry ${id} for content type: ${contentType}`);
    
    // Extract the collection name from the content type UID
    const collection = contentType.split(".")[1];
    
    // Update the entry in Strapi
    const response = await strapiClient.put(`/api/${collection}/${id}`, {
      data: data
    });
    
    return response.data.data;
  } catch (error) {
    console.error(`[Error] Failed to update entry ${id} for ${contentType}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to update entry ${id} for ${contentType}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Delete an entry
 */
async function deleteEntry(contentType: string, id: string): Promise<void> {
  try {
    console.error(`[API] Deleting entry ${id} for content type: ${contentType}`);
    
    // Extract the collection name from the content type UID
    const collection = contentType.split(".")[1];
    
    // Delete the entry from Strapi
    await strapiClient.delete(`/api/${collection}/${id}`);
  } catch (error) {
    console.error(`[Error] Failed to delete entry ${id} for ${contentType}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to delete entry ${id} for ${contentType}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Upload a media file to Strapi
 */
async function uploadMedia(fileData: string, fileName: string, fileType: string): Promise<any> {
  try {
    console.error(`[API] Uploading media file: ${fileName}`);
    
    const buffer = Buffer.from(fileData, 'base64');
    
    // Use FormData for file upload
    const formData = new FormData();
    // Convert Buffer to Blob with the correct content type
    const blob = new Blob([buffer], { type: fileType });
    formData.append('files', blob, fileName);

    const response = await strapiClient.post('/api/upload', formData, {
      headers: {
        // Let axios set the correct multipart/form-data content-type with boundary
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`[Error] Failed to upload media file ${fileName}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to upload media file ${fileName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch the schema for a specific content type
 */
async function fetchContentTypeSchema(contentType: string): Promise<any> {
  try {
    console.error(`[API] Fetching schema for content type: ${contentType}`);

    // Use the content-type-builder API endpoint
    // Note: This usually requires admin privileges/permissions
    const endpoint = `/content-type-builder/content-types/${contentType}`;

    const response = await strapiClient.get(endpoint);

    // The schema is typically nested under response.data.data
    return response.data.data;
  } catch (error: any) {
    let errorMessage = `Failed to fetch schema for ${contentType}`;
    let errorCode = ErrorCode.InternalError;

    if (axios.isAxiosError(error)) {
      errorMessage += `: ${error.response?.status} ${error.response?.statusText}`;
      if (error.response?.status === 404) {
        errorCode = ErrorCode.InvalidRequest;
        errorMessage += ` (Content type not found or insufficient permissions)`;
      } else if (error.response?.status === 403) {
        errorCode = ErrorCode.InvalidRequest;
        errorMessage += ` (Permission denied - check API token permissions for Content-Type Builder)`;
      }
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    } else {
      errorMessage += `: ${String(error)}`;
    }

    console.error(`[Error] ${errorMessage}`);
    throw new McpError(errorCode, errorMessage);
  }
}

/**
 * Connect related entries for a specific field
 */
async function connectRelation(contentType: string, id: string, relationField: string, relatedIds: number[] | string[]): Promise<any> {
  try {
    console.error(`[API] Connecting relations for ${contentType} ${id}, field ${relationField}`);
    const updateData = {
      data: { // Strapi v4 expects relation updates within the 'data' object for PUT
        [relationField]: {
          connect: relatedIds.map(rid => ({ id: Number(rid) })) // Ensure IDs are numbers
        }
      }
    };
    // Reuse updateEntry logic which correctly wraps payload in { data: ... }
    return await updateEntry(contentType, id, updateData.data); 
  } catch (error) {
    // Rethrow McpError or wrap others
    if (error instanceof McpError) throw error;
    console.error(`[Error] Failed to connect relation ${relationField} for ${contentType} ${id}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to connect relation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Disconnect related entries for a specific field
 */
async function disconnectRelation(contentType: string, id: string, relationField: string, relatedIds: number[] | string[]): Promise<any> {
  try {
    console.error(`[API] Disconnecting relations for ${contentType} ${id}, field ${relationField}`);
     const updateData = {
      data: { // Strapi v4 expects relation updates within the 'data' object for PUT
        [relationField]: {
          disconnect: relatedIds.map(rid => ({ id: Number(rid) })) // Ensure IDs are numbers
        }
      }
    };
    // Reuse updateEntry logic which correctly wraps payload in { data: ... }
    return await updateEntry(contentType, id, updateData.data); 

  } catch (error) {
     // Rethrow McpError or wrap others
     if (error instanceof McpError) throw error;
    console.error(`[Error] Failed to disconnect relation ${relationField} for ${contentType} ${id}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to disconnect relation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handler for listing available Strapi content as resources.
 * Each content type and entry is exposed as a resource with:
 * - A strapi:// URI scheme
 * - JSON MIME type
 * - Human readable name and description
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    // Fetch all content types
    const contentTypes = await fetchContentTypes();
    
    // Create a resource for each content type
    const contentTypeResources = contentTypes.map(ct => ({
      uri: `strapi://content-type/${ct.uid}`,
      mimeType: "application/json",
      name: ct.info.displayName,
      description: `Strapi content type: ${ct.info.displayName}`
    }));
    
    // Return the resources
    return {
      resources: contentTypeResources
    };
  } catch (error) {
    console.error("[Error] Failed to list resources:", error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list resources: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

/**
 * Handler for reading the contents of a specific resource.
 * Takes a strapi:// URI and returns the content as JSON.
 * 
 * Supports URIs in the following formats:
 * - strapi://content-type/[contentTypeUid] - Get all entries for a content type
 * - strapi://content-type/[contentTypeUid]/[entryId] - Get a specific entry
 * - strapi://content-type/[contentTypeUid]?[queryParams] - Get filtered entries
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
  try {
    const uri = request.params.uri;
    
    // Parse the URI for content type
    const contentTypeMatch = uri.match(/^strapi:\/\/content-type\/([^\/\?]+)(?:\/([^\/\?]+))?(?:\?(.+))?$/);
    if (!contentTypeMatch) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Invalid URI format: ${uri}`
      );
    }
    
    const contentTypeUid = contentTypeMatch[1];
    const entryId = contentTypeMatch[2];
    const queryString = contentTypeMatch[3];
    
    // Parse query parameters if present
    let queryParams: QueryParams = {};
    if (queryString) {
      try {
        // Parse the query string into an object
        const parsedParams = new URLSearchParams(queryString);
        
        // Extract filters
        const filtersParam = parsedParams.get('filters');
        if (filtersParam) {
          queryParams.filters = JSON.parse(filtersParam);
        }
        
        // Extract pagination
        const pageParam = parsedParams.get('page');
        const pageSizeParam = parsedParams.get('pageSize');
        if (pageParam || pageSizeParam) {
          queryParams.pagination = {};
          if (pageParam) queryParams.pagination.page = parseInt(pageParam, 10);
          if (pageSizeParam) queryParams.pagination.pageSize = parseInt(pageSizeParam, 10);
        }
        
        // Extract sort
        const sortParam = parsedParams.get('sort');
        if (sortParam) {
          queryParams.sort = sortParam.split(',');
        }
        
        // Extract populate
        const populateParam = parsedParams.get('populate');
        if (populateParam) {
          try {
            // Try to parse as JSON
            queryParams.populate = JSON.parse(populateParam);
          } catch {
            // If not valid JSON, treat as comma-separated string
            queryParams.populate = populateParam.split(',');
          }
        }
        
        // Extract fields
        const fieldsParam = parsedParams.get('fields');
        if (fieldsParam) {
          queryParams.fields = fieldsParam.split(',');
        }
      } catch (parseError) {
        console.error("[Error] Failed to parse query parameters:", parseError);
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid query parameters: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        );
      }
    }
    
    // If an entry ID is provided, fetch that specific entry
    if (entryId) {
      const entry = await fetchEntry(contentTypeUid, entryId, queryParams);
      
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(entry, null, 2)
        }]
      };
    }
    
    // Otherwise, fetch entries with query parameters
    const entries = await fetchEntries(contentTypeUid, queryParams);
    
    // Return the entries as JSON
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(entries, null, 2)
      }]
    };
  } catch (error) {
    console.error("[Error] Failed to read resource:", error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to read resource: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

/**
 * Handler that lists available tools.
 * Exposes tools for working with Strapi content.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_content_types",
        description: "List all available content types in Strapi",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_entries",
        description: "Get entries for a specific content type with optional filtering, pagination, sorting, and population of relations",
        inputSchema: {
          type: "object",
          properties: {
            contentType: {
              type: "string",
              description: "The content type UID (e.g., 'api::article.article')"
            },
            options: {
              type: "string",
              description: "JSON string with query options including filters, pagination, sort, populate, and fields. Example: '{\"filters\":{\"title\":{\"$contains\":\"hello\"}},\"pagination\":{\"page\":1,\"pageSize\":10},\"sort\":[\"title:asc\"],\"populate\":[\"author\",\"categories\"],\"fields\":[\"title\",\"content\"]}'"
            }
          },
          required: ["contentType"]
        }
      },
      {
        name: "get_entry",
        description: "Get a specific entry by ID",
        inputSchema: {
          type: "object",
          properties: {
            contentType: {
              type: "string",
              description: "The content type UID (e.g., 'api::article.article')"
            },
            id: {
              type: "string",
              description: "The ID of the entry"
            },
            options: {
              type: "string",
              description: "JSON string with query options including populate and fields. Example: '{\"populate\":[\"author\",\"categories\"],\"fields\":[\"title\",\"content\"]}'"
            }
          },
          required: ["contentType", "id"]
        }
      },
      {
        name: "create_entry",
        description: "Create a new entry for a content type",
        inputSchema: {
          type: "object",
          properties: {
            contentType: {
              type: "string",
              description: "The content type UID (e.g., 'api::article.article')"
            },
            data: {
              type: "object",
              description: "The data for the new entry"
            }
          },
          required: ["contentType", "data"]
        }
      },
      {
        name: "update_entry",
        description: "Update an existing entry",
        inputSchema: {
          type: "object",
          properties: {
            contentType: {
              type: "string",
              description: "The content type UID (e.g., 'api::article.article')"
            },
            id: {
              type: "string",
              description: "The ID of the entry to update"
            },
            data: {
              type: "object",
              description: "The updated data for the entry"
            }
          },
          required: ["contentType", "id", "data"]
        }
      },
      {
        name: "delete_entry",
        description: "Delete an entry for a specific content type.",
        inputSchema: {
          type: "object",
          properties: {
            contentType: {
              type: "string",
              description: "The API ID of the content type (e.g., 'api::article.article').",
              required: true,
            },
            id: {
              type: "string",
              description: "The ID of the entry to delete.",
              required: true,
            },
          },
          required: ["contentType", "id"]
        }
      },
      {
        name: "upload_media",
        description: "Upload a media file to the Strapi Media Library.",
        inputSchema: {
          type: "object",
          properties: {
            fileData: {
              type: "string",
              description: "Base64 encoded string of the file data.",
              required: true,
            },
            fileName: {
              type: "string",
              description: "The desired name for the file.",
              required: true,
            },
            fileType: {
              type: "string",
              description: "The MIME type of the file (e.g., 'image/jpeg', 'application/pdf').",
              required: true,
            },
          },
          required: ["fileData", "fileName", "fileType"]
        }
      },
      {
        name: "get_content_type_schema",
        description: "Get the schema (fields, types, relations) for a specific content type.",
        inputSchema: {
          type: "object",
          properties: {
            contentType: {
              type: "string",
              description: "The API ID of the content type (e.g., 'api::article.article').",
              required: true,
            },
          },
          required: ["contentType"]
        }
      },
      {
        name: "connect_relation",
        description: "Connect one or more related entries to a specific entry's relation field.",
        inputSchema: {
          type: "object",
          properties: {
            contentType: { type: "string", description: "The API ID of the main entry's content type (e.g., 'api::article.article')." },
            id: { type: "string", description: "The ID of the main entry to update." },
            relationField: { type: "string", description: "The name of the relation field to modify." },
            relatedIds: { type: "array", items: { type: ["string", "number"] }, description: "An array of IDs of the entries to connect." }
          },
          required: ["contentType", "id", "relationField", "relatedIds"]
        }
      },
      {
        name: "disconnect_relation",
        description: "Disconnect one or more related entries from a specific entry's relation field.",
        inputSchema: {
          type: "object",
          properties: {
            contentType: { type: "string", description: "The API ID of the main entry's content type (e.g., 'api::article.article')." },
            id: { type: "string", description: "The ID of the main entry to update." },
            relationField: { type: "string", description: "The name of the relation field to modify." },
            relatedIds: { type: "array", items: { type: ["string", "number"] }, description: "An array of IDs of the entries to disconnect." }
          },
          required: ["contentType", "id", "relationField", "relatedIds"]
        }
      },
    ]
  };
});

/**
 * Handler for tool calls.
 * Implements various tools for working with Strapi content.
 */
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    switch (request.params.name) {
      case "list_content_types": {
        const contentTypes = await fetchContentTypes();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(contentTypes.map(ct => ({
              uid: ct.uid,
              displayName: ct.info.displayName,
              description: ct.info.description
            })), null, 2)
          }]
        };
      }
      
      case "get_entries": {
        const { contentType, options } = request.params.arguments as any;
        if (!contentType) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Content type is required"
          );
        }
        
        // Parse the options string into a queryParams object
        let queryParams: QueryParams = {};
        if (options) {
          try {
            queryParams = JSON.parse(options);
          } catch (parseError) {
            console.error("[Error] Failed to parse query options:", parseError);
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid query options: ${parseError instanceof Error ? parseError.message : String(parseError)}`
            );
          }
        }
        
        // Fetch entries with query parameters
        const entries = await fetchEntries(String(contentType), queryParams);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(entries, null, 2)
          }]
        };
      }
      
      case "get_entry": {
        const { contentType, id, options } = request.params.arguments as any;
        
        if (!contentType || !id) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Content type and ID are required"
          );
        }
        
        // Parse the options string into a queryParams object
        let queryParams: QueryParams = {};
        if (options) {
          try {
            queryParams = JSON.parse(options);
          } catch (parseError) {
            console.error("[Error] Failed to parse query options:", parseError);
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid query options: ${parseError instanceof Error ? parseError.message : String(parseError)}`
            );
          }
        }
        
        const entry = await fetchEntry(String(contentType), String(id), queryParams);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(entry, null, 2)
          }]
        };
      }
      
      case "create_entry": {
        const contentType = String(request.params.arguments?.contentType);
        const data = request.params.arguments?.data;
        
        if (!contentType || !data) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Content type and data are required"
          );
        }
        
        const entry = await createEntry(contentType, data);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(entry, null, 2)
          }]
        };
      }
      
      case "update_entry": {
        const contentType = String(request.params.arguments?.contentType);
        const id = String(request.params.arguments?.id);
        const data = request.params.arguments?.data;
        
        if (!contentType || !id || !data) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Content type, ID, and data are required"
          );
        }
        
        const entry = await updateEntry(contentType, id, data);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(entry, null, 2)
          }]
        };
      }
      
      case "delete_entry": {
        const contentType = String(request.params.arguments?.contentType);
        const id = String(request.params.arguments?.id);
        
        if (!contentType || !id) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Content type and ID are required"
          );
        }
        
        await deleteEntry(contentType, id);
        
        return {
          content: [{
            type: "text",
            text: `Successfully deleted entry ${id} from ${contentType}`
          }]
        };
      }
      
      case "upload_media": {
        const fileData = String(request.params.arguments?.fileData);
        const fileName = String(request.params.arguments?.fileName);
        const fileType = String(request.params.arguments?.fileType);
        
        if (!fileData || !fileName || !fileType) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "File data, file name, and file type are required"
          );
        }
        
        const media = await uploadMedia(fileData, fileName, fileType);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(media, null, 2)
          }]
        };
      }
      
      case "get_content_type_schema": {
        const contentType = String(request.params.arguments?.contentType);
        if (!contentType) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Content type is required"
          );
        }
        const schema = await fetchContentTypeSchema(contentType);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(schema, null, 2)
          }]
        };
      }
      
      case "connect_relation": {
        const { contentType, id, relationField, relatedIds } = request.params.arguments as any;
        if (!contentType || !id || !relationField || !Array.isArray(relatedIds)) {
          throw new McpError(ErrorCode.InvalidParams, "contentType, id, relationField, and relatedIds (array) are required.");
        }
        const result = await connectRelation(String(contentType), String(id), String(relationField), relatedIds);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "disconnect_relation": {
         const { contentType, id, relationField, relatedIds } = request.params.arguments as any;
         if (!contentType || !id || !relationField || !Array.isArray(relatedIds)) {
          throw new McpError(ErrorCode.InvalidParams, "contentType, id, relationField, and relatedIds (array) are required.");
        }
        const result = await disconnectRelation(String(contentType), String(id), String(relationField), relatedIds);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  } catch (error) {
    console.error(`[Error] Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  console.error("[Setup] Starting Strapi MCP server");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[Setup] Strapi MCP server running");
}

main().catch((error) => {
  console.error("[Error] Server error:", error);
  process.exit(1);
});
