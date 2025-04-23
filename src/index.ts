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

// Extended error codes to include additional ones we need
enum ExtendedErrorCode {
  // Original error codes from SDK
  InvalidRequest = 'InvalidRequest',
  MethodNotFound = 'MethodNotFound',
  InvalidParams = 'InvalidParams',
  InternalError = 'InternalError',
  
  // Additional error codes
  ResourceNotFound = 'ResourceNotFound',
  AccessDenied = 'AccessDenied'
}

// Custom error class extending McpError to support our extended error codes
class ExtendedMcpError extends McpError {
  public extendedCode: ExtendedErrorCode;
  
  constructor(code: ExtendedErrorCode, message: string) {
    // Map our extended codes to standard MCP error codes when needed
    let mcpCode: ErrorCode;
    
    // Map custom error codes to standard MCP error codes
    switch (code) {
      case ExtendedErrorCode.ResourceNotFound:
      case ExtendedErrorCode.AccessDenied:
        // Map custom codes to InternalError for SDK compatibility
        mcpCode = ErrorCode.InternalError;
        break;
      case ExtendedErrorCode.InvalidRequest:
        mcpCode = ErrorCode.InvalidRequest;
        break;
      case ExtendedErrorCode.MethodNotFound:
        mcpCode = ErrorCode.MethodNotFound;
        break;
      case ExtendedErrorCode.InvalidParams:
        mcpCode = ErrorCode.InvalidParams;
        break;
      case ExtendedErrorCode.InternalError:
      default:
        mcpCode = ErrorCode.InternalError;
        break;
    }
    
    // Call super before accessing 'this'
    super(mcpCode, message);
    
    // Store the extended code for reference
    this.extendedCode = code;
  }
}

// Configuration from environment variables
const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_DEV_MODE = process.env.STRAPI_DEV_MODE === "true";
const STRAPI_ADMIN_EMAIL = process.env.STRAPI_ADMIN_EMAIL;
const STRAPI_ADMIN_PASSWORD = process.env.STRAPI_ADMIN_PASSWORD;

// Validate required environment variables
if (!STRAPI_API_TOKEN && !(STRAPI_ADMIN_EMAIL && STRAPI_ADMIN_PASSWORD)) {
  console.error("[Error] Missing required authentication. Please provide either STRAPI_API_TOKEN or both STRAPI_ADMIN_EMAIL and STRAPI_ADMIN_PASSWORD environment variables");
  process.exit(1);
}

console.error(`[Setup] Connecting to Strapi at ${STRAPI_URL}`);
console.error(`[Setup] Development mode: ${STRAPI_DEV_MODE ? "enabled" : "disabled"}`);
console.error(`[Setup] Authentication: ${STRAPI_API_TOKEN ? "Using API token" : "Using admin credentials"}`);

// Axios instance for Strapi API
const strapiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: function (status) {
    // Consider only 5xx as errors - for more robust error handling
    return status < 500;
  }
});

// If API token is provided, use it
if (STRAPI_API_TOKEN) {
  strapiClient.defaults.headers.common['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
}

// Store admin JWT token if we log in
let adminJwtToken: string | null = null;

/**
 * Log in to the Strapi admin API using provided credentials
 */
async function loginToStrapiAdmin(): Promise<boolean> {
  if (!STRAPI_ADMIN_EMAIL || !STRAPI_ADMIN_PASSWORD) {
    console.error("[Auth] No admin credentials provided, skipping admin login");
    return false;
  }

  try {
    console.error(`[Auth] Attempting to log in to Strapi admin as ${STRAPI_ADMIN_EMAIL}`);
    
    const response = await axios.post(`${STRAPI_URL}/admin/login`, {
      email: STRAPI_ADMIN_EMAIL,
      password: STRAPI_ADMIN_PASSWORD
    });
    
    if (response.data && response.data.data && response.data.data.token) {
      adminJwtToken = response.data.data.token;
      console.error("[Auth] Successfully logged in to Strapi admin");
      return true;
    } else {
      console.error("[Auth] Login response missing token");
      return false;
    }
  } catch (error) {
    console.error("[Auth] Failed to log in to Strapi admin:", error);
    return false;
  }
}

/**
 * Make a request to the admin API using the admin JWT token
 */
async function makeAdminApiRequest(endpoint: string, method: string = 'get', data?: any): Promise<any> {
  if (!adminJwtToken) {
    // Try to log in first
    const success = await loginToStrapiAdmin();
    if (!success) {
      throw new Error("Not authenticated for admin API access");
    }
  }
  
  try {
    const response = await axios({
      method,
      url: `${STRAPI_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${adminJwtToken}`,
        'Content-Type': 'application/json'
      },
      data
    });
    
    return response.data;
  } catch (error) {
    console.error(`[Admin API] Request to ${endpoint} failed:`, error);
    throw error;
  }
}

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
     // --- DEBUG: Temporarily disable cache ---
     // if (contentTypesCache.length > 0) {
     //   console.error("[API] Returning cached content types");
     //   return contentTypesCache;
     // }
     // --- END DEBUG ---

    // Helper function to process and cache content types
    const processAndCacheContentTypes = (data: any[], source: string): any[] => {
      console.error(`[API] Successfully fetched collection types from ${source}`);
      const contentTypes = data.map((item: any) => {
        const uid = item.uid;
        const apiID = uid.split('.').pop() || '';
        return {
          uid: uid,
          apiID: apiID,
          info: {
            displayName: item.info?.displayName || apiID.charAt(0).toUpperCase() + apiID.slice(1).replace(/-/g, ' '),
            description: item.info?.description || `${apiID} content type`,
          },
          attributes: item.attributes || {}
        };
      });

      // Filter out internal types
      const filteredTypes = contentTypes.filter((ct: any) =>
        !ct.uid.startsWith("admin::") &&
        !ct.uid.startsWith("plugin::")
      );

      console.error(`[API] Found ${filteredTypes.length} content types via ${source}`);
      contentTypesCache = filteredTypes; // Update cache
      return filteredTypes;
    };
 
     // --- Attempt 1: Use Admin Credentials if available ---
     // DEBUG: Log the values the function sees
     console.error(`[DEBUG] Checking admin creds: EMAIL=${Boolean(STRAPI_ADMIN_EMAIL)}, PASSWORD=${Boolean(STRAPI_ADMIN_PASSWORD)}`);
     if (STRAPI_ADMIN_EMAIL && STRAPI_ADMIN_PASSWORD) {
       console.error("[API] Attempting to fetch content types using admin credentials");
       try {
         // Use makeAdminApiRequest which handles login
         // Try the content-type-builder endpoint first, as it's more common for schema listing
         console.error("[API] Trying admin endpoint: /content-type-builder/content-types");
         const adminResponse = await makeAdminApiRequest('/content-type-builder/content-types');
 
         // Strapi's admin API often wraps data, check common structures
         let adminData = null;
        if (adminResponse && adminResponse.data && Array.isArray(adminResponse.data)) {
            adminData = adminResponse.data; // Direct array in response.data
        } else if (adminResponse && Array.isArray(adminResponse)) {
            adminData = adminResponse; // Direct array response
        }
        
        if (adminData) {
          return processAndCacheContentTypes(adminData, "Admin API (/content-manager/collection-types)");
        } else {
           console.error("[API] Admin API response did not contain expected data array.", adminResponse);
        }
      } catch (adminError) {
        console.error(`[API] Failed to fetch content types using admin credentials:`, adminError);
        // Don't throw, proceed to next method
      }
    } else {
       console.error("[API] Admin credentials not provided, skipping admin API attempt.");
    }

    // --- Attempt 2: Use API Token via strapiClient (Original Primary Method) ---
    console.error("[API] Attempting to fetch content types using API token (strapiClient)");
    try {
      // This is the most reliable way *if* the token has permissions
      const response = await strapiClient.get('/content-manager/collection-types');

      if (response.data && Array.isArray(response.data)) {
        // Note: This path might require admin permissions, often fails with API token
        return processAndCacheContentTypes(response.data, "Content Manager API (/content-manager/collection-types)");
        
        // Transform to our expected format
        const contentTypes = response.data.map((item: any) => {
          const uid = item.uid;
          const apiID = uid.split('.').pop() || '';
          return {
            uid: uid,
            apiID: apiID,
            info: {
              displayName: item.info?.displayName || apiID.charAt(0).toUpperCase() + apiID.slice(1).replace(/-/g, ' '),
              description: item.info?.description || `${apiID} content type`,
            },
            attributes: item.attributes || {}
          };
        });
        
        // Filter out internal types
        const filteredTypes = contentTypes.filter((ct: any) => 
          !ct.uid.startsWith("admin::") && 
          !ct.uid.startsWith("plugin::")
        );
        
        console.error(`[API] Found ${filteredTypes.length} content types`);
        contentTypesCache = filteredTypes;
        return filteredTypes;
      }
    } catch (apiError) {
      console.error(`[API] Failed to fetch from content manager API:`, apiError);
    }
    
    // Try to check what's available at the /api endpoint
    try {
      const response = await strapiClient.get('/api');
      
      if (response.data && typeof response.data === 'object') {
        console.error(`[API] Found API endpoint with available collections`);
        
        // Get collection names from the root API
        const collections = Object.keys(response.data);
        console.error(`[API] Collections available: ${collections.join(', ')}`);
        
        if (collections.length > 0) {
          // Convert to content types
          const contentTypes = collections.map(name => ({
            uid: `api::${name}.${name}`,
            apiID: name,
            info: {
              displayName: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
              description: `${name} content type`,
            },
            attributes: {}
          }));
          
          contentTypesCache = contentTypes;
          return contentTypes;
        }
      }
    } catch (apiError) {
      console.error(`[API] Failed to fetch from API root:`, apiError);
    }
    
    // Try to directly check for the collection types we see in the screenshot
    try {
      const knownTypes = [
        'order', 'order-item', 'speaker', 'sponsor', 'talk', 
        'talk-tags', 'ticket', 'training', 'user', 'settings'
      ];
      
      console.error(`[API] Directly checking for known collection types`);
      
      const verifiedTypes = [];
      
      for (const name of knownTypes) {
        try {
          // Check if this collection exists by trying to access it
          await strapiClient.get(`/api/${name}`);
          console.error(`[API] Found collection: ${name}`);
          
          verifiedTypes.push({
            uid: `api::${name}.${name}`,
            apiID: name,
            info: {
              displayName: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
              description: `${name} content type`,
            },
            attributes: {}
          });
        } catch (err) {
          // Skip collections that return 404
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            continue;
          }
          
          // If we got a different error (like 401/403), the endpoint probably exists
          if (axios.isAxiosError(err)) {
            console.error(`[API] Collection ${name} exists but returned ${err.response?.status}`);
            verifiedTypes.push({
              uid: `api::${name}.${name}`,
              apiID: name,
              info: {
                displayName: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
                description: `${name} content type`,
              },
              attributes: {}
            });
          }
        }
      }
      
      if (verifiedTypes.length > 0) {
        console.error(`[API] Found ${verifiedTypes.length} known collection types`);
        contentTypesCache = verifiedTypes;
        return verifiedTypes;
      }
    } catch (err) {
      console.error(`[API] Error checking known types:`, err);
    }
    
    // Return empty array if all attempts failed
    console.error(`[API] All attempts to find content types failed`);
    return [];
    
  } catch (error: any) {
    console.error("[Error] Failed to fetch content types:", error);
    
    let errorMessage = "Failed to fetch content types";
    let errorCode = ExtendedErrorCode.InternalError;
    
    if (axios.isAxiosError(error)) {
      errorMessage += `: ${error.response?.status} ${error.response?.statusText}`;
      if (error.response?.status === 403) {
        errorCode = ExtendedErrorCode.AccessDenied;
        errorMessage += ` (Permission denied - check API token permissions)`;
      } else if (error.response?.status === 401) {
        errorCode = ExtendedErrorCode.AccessDenied;
        errorMessage += ` (Unauthorized - API token may be invalid or expired)`;
      }
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    } else {
      errorMessage += `: ${String(error)}`;
    }
    
    throw new ExtendedMcpError(errorCode, errorMessage);
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
    
    // Try multiple possible API paths
    const possiblePaths = [
      `/api/${collection}`,
      `/api/${collection.toLowerCase()}`,
      `/api/v1/${collection}`,
      `/${collection}`,
      `/${collection.toLowerCase()}`
    ];
    
    let response;
    let success = false;
    
    // Try each path until one works
    for (const path of possiblePaths) {
      try {
        console.error(`[API] Trying path: ${path}`);
        response = await strapiClient.get(path, { params });
        
        // Check if response contains error
        if (response.data && response.data.error) {
          console.error(`[API] Path ${path} returned an error:`, response.data.error);
          continue;
        }
        
        console.error(`[API] Successfully fetched data from: ${path}`);
        success = true;
        break;
      } catch (err: any) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // Continue to try the next path if not found
          console.error(`[API] Path ${path} not found, trying next option...`);
          continue;
        }
        // For other errors, throw immediately
        throw err;
      }
    }
    
    if (!success || !response) {
      console.error(`[API] Could not find any valid API path for ${collection}`);
      return {
        data: [],
        meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } }
      };
    }
    
    // Handle different response structures and filter out errors
    if (response.data.data) {
      // Standard Strapi v4 response
      const filteredData = Array.isArray(response.data.data) 
        ? response.data.data.filter((item: any) => !item.error)
        : (response.data.data.error ? [] : [response.data.data]);
      
      return {
        data: filteredData,
        meta: response.data.meta || {}
      };
    } else if (Array.isArray(response.data)) {
      // Array response, likely a custom endpoint or Strapi v3
      const filteredData = response.data.filter((item: any) => !item.error);
      
      return {
        data: filteredData,
        meta: { pagination: { page: 1, pageSize: filteredData.length, pageCount: 1, total: filteredData.length } }
      };
    } else if (response.data && response.data.error) {
      // Error response, return empty data
      console.error(`[API] Error response from API:`, response.data.error);
      return {
        data: [],
        meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } }
      };
    } else {
      // Other response formats, try to handle gracefully
      return {
        data: [response.data],
        meta: {}
      };
    }
  } catch (error) {
    console.error(`[Error] Failed to fetch entries for ${contentType}:`, error);
    // Return empty dataset instead of throwing error for better UX
    return {
      data: [],
      meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } }
    };
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
  } catch (error: any) {
    console.error(`[Error] Failed to fetch entry ${id} for ${contentType}:`, error);
    
    let errorMessage = `Failed to fetch entry ${id} for ${contentType}`;
    let errorCode = ExtendedErrorCode.InternalError;

    if (axios.isAxiosError(error)) {
      errorMessage += `: ${error.response?.status} ${error.response?.statusText}`;
      if (error.response?.status === 404) {
        errorCode = ExtendedErrorCode.ResourceNotFound;
        errorMessage += ` (Entry not found)`;
      } else if (error.response?.status === 403) {
        errorCode = ExtendedErrorCode.AccessDenied;
        errorMessage += ` (Permission denied - check API token permissions)`;
      } else if (error.response?.status === 401) {
        errorCode = ExtendedErrorCode.AccessDenied;
        errorMessage += ` (Unauthorized - API token may be invalid or expired)`;
      }
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    } else {
      errorMessage += `: ${String(error)}`;
    }
    
    throw new ExtendedMcpError(errorCode, errorMessage);
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
 
     // --- Attempt 1: Use Admin Credentials if available ---
     if (STRAPI_ADMIN_EMAIL && STRAPI_ADMIN_PASSWORD) {
       console.error("[API] Attempting to fetch schema using admin credentials");
       try {
         const endpoint = `/content-type-builder/content-types/${contentType}`;
         console.error(`[API] Trying admin endpoint: ${endpoint}`);
         const adminResponse = await makeAdminApiRequest(endpoint);
 
         // Check for schema data (often nested under 'data')
         if (adminResponse && adminResponse.data) {
            console.error("[API] Successfully fetched schema via Admin API");
            return adminResponse.data; // Return the schema data
         } else {
            console.error("[API] Admin API response for schema did not contain expected data.", adminResponse);
         }
       } catch (adminError) {
         console.error(`[API] Failed to fetch schema using admin credentials:`, adminError);
         // Don't throw, proceed to next method if it was a 404 or auth error
         if (!(axios.isAxiosError(adminError) && (adminError.response?.status === 401 || adminError.response?.status === 403 || adminError.response?.status === 404))) {
            throw adminError; // Rethrow unexpected errors
         }
       }
     } else {
        console.error("[API] Admin credentials not provided, skipping admin API attempt for schema.");
     }
 
     // --- Attempt 2: Infer schema from public API (Fallback) ---
     console.error("[API] Attempting to infer schema from public API");

    // Extract the collection name from the content type UID
    const collection = contentType.split(".")[1];
    
    // Try to get a sample entry to infer the schema
    try {
      // Try multiple possible API paths
      const possiblePaths = [
        `/api/${collection}`,
        `/api/${collection.toLowerCase()}`,
        `/api/v1/${collection}`,
        `/${collection}`,
        `/${collection.toLowerCase()}`
      ];
      
      let response;
      let success = false;
      
      // Try each path until one works
      for (const path of possiblePaths) {
        try {
          console.error(`[API] Trying path for schema inference: ${path}`);
          // Request with small limit to minimize data transfer
          response = await strapiClient.get(`${path}?pagination[limit]=1&pagination[page]=1`);
          console.error(`[API] Successfully fetched sample data from: ${path}`);
          success = true;
          break;
        } catch (err: any) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            // Continue to try the next path if not found
            continue;
          }
          // For other errors, throw immediately
          throw err;
        }
      }
      
      if (!success || !response) {
        throw new Error(`Could not find any valid API path for ${collection}`);
      }
      
      // Extract a sample entry to infer schema
      let sampleEntry;
      if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        // Standard Strapi v4 response
        sampleEntry = response.data.data[0];
      } else if (Array.isArray(response.data) && response.data.length > 0) {
        // Array response
        sampleEntry = response.data[0];
      } else if (response.data) {
        // Object response
        sampleEntry = response.data;
      }
      
      if (!sampleEntry) {
        throw new Error(`No sample entries available to infer schema for ${contentType}`);
      }
      
      // Infer schema from sample entry
      const attributes: Record<string, any> = {};
      
      // Process entry to infer attribute types
      Object.entries(sampleEntry.attributes || sampleEntry).forEach(([key, value]) => {
        if (key === 'id') return; // Skip ID field
        
        let type: string = typeof value;
        
        if (type === 'object') {
          if (value === null) {
            type = 'string'; // Assume nullable string
          } else if (Array.isArray(value)) {
            type = 'relation'; // Assume array is a relation
          } else if (value instanceof Date) {
            type = 'datetime';
          } else {
            type = 'json'; // Complex object
          }
        }
        
        attributes[key] = { type };
      });
      
      // Return inferred schema
      return {
        uid: contentType,
        apiID: collection,
        info: {
          displayName: collection.charAt(0).toUpperCase() + collection.slice(1),
          description: `Inferred schema for ${collection}`,
        },
        attributes
      };
      
    } catch (inferError) {
      console.error(`[API] Failed to infer schema:`, inferError);
      
      // Return a minimal schema as fallback
      return {
        uid: contentType,
        apiID: collection,
        info: {
          displayName: collection.charAt(0).toUpperCase() + collection.slice(1),
          description: `${collection} content type`,
        },
        attributes: {}
      };
    }
  } catch (error: any) {
    let errorMessage = `Failed to fetch schema for ${contentType}`;
    let errorCode = ExtendedErrorCode.InternalError;

    if (axios.isAxiosError(error)) {
      errorMessage += `: ${error.response?.status} ${error.response?.statusText}`;
      if (error.response?.status === 404) {
        errorCode = ExtendedErrorCode.ResourceNotFound;
        errorMessage += ` (Content type not found)`;
      } else if (error.response?.status === 403) {
        errorCode = ExtendedErrorCode.AccessDenied;
        errorMessage += ` (Permission denied - check API token permissions for Content-Type Builder)`;
      } else if (error.response?.status === 401) {
        errorCode = ExtendedErrorCode.AccessDenied;
        errorMessage += ` (Unauthorized - API token may be invalid or expired)`;
      } else if (error.response?.status === 400) {
        errorCode = ExtendedErrorCode.InvalidRequest;
        errorMessage += ` (Bad request - malformed content type ID)`;
      }
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    } else {
      errorMessage += `: ${String(error)}`;
    }

    console.error(`[Error] ${errorMessage}`);
    throw new ExtendedMcpError(errorCode, errorMessage);
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
  * Create a new content type in Strapi. Requires admin privileges.
  */
 async function createContentType(contentTypeData: any): Promise<any> {
   try {
     const { displayName, singularName, pluralName, kind = 'collectionType', attributes, options = { draftAndPublish: true }, description = "" } = contentTypeData;
 
     if (!displayName || !singularName || !pluralName || !attributes) {
       throw new Error("Missing required fields: displayName, singularName, pluralName, attributes");
     }
 
     // Construct the payload for the Content-Type Builder API
     // Ensure API IDs are Strapi-compliant (lowercase, no spaces, etc.)
     const singularApiId = singularName.toLowerCase().replace(/\s+/g, '-');
     const pluralApiId = pluralName.toLowerCase().replace(/\s+/g, '-');
     const collectionName = pluralName.toLowerCase().replace(/\s+/g, '_'); // Table name often uses underscores
 
     const payload = {
       contentType: {
         kind: kind,
         collectionName: collectionName,
         info: {
           singularName: singularApiId,
           pluralName: pluralApiId,
           displayName: displayName,
           description: description
         },
         options: options,
         // Ensure attributes is an object { fieldName: { type: 'string', ... }, ... }
         attributes: typeof attributes === 'object' && !Array.isArray(attributes) ? attributes : {}
       }
       // Potentially add 'components' key if needed later
     };
 
     console.error(`[API] Creating new content type: ${displayName}`);
     console.error(`[API] Payload: ${JSON.stringify(payload, null, 2)}`);
 
     // Use makeAdminApiRequest to ensure admin authentication
     const response = await makeAdminApiRequest('/content-type-builder/content-types', 'post', payload);
 
     console.error(`[API] Content type creation response:`, response);
 
     // Strapi might restart after schema changes, response might vary
     // Often returns { data: { uid: 'api::...' } } or similar on success
     return response?.data || { message: "Content type creation initiated. Strapi might be restarting." };
 
   } catch (error: any) {
     console.error(`[Error] Failed to create content type:`, error);
 
     let errorMessage = `Failed to create content type`;
     let errorCode = ExtendedErrorCode.InternalError;
 
     if (axios.isAxiosError(error)) {
       errorMessage += `: ${error.response?.status} ${error.response?.statusText}`;
       if (error.response?.status === 400) {
          errorCode = ExtendedErrorCode.InvalidParams;
          errorMessage += ` (Bad Request - Check payload format/names): ${JSON.stringify(error.response?.data)}`;
       } else if (error.response?.status === 403 || error.response?.status === 401) {
          errorCode = ExtendedErrorCode.AccessDenied;
          errorMessage += ` (Permission Denied - Admin credentials might lack permissions)`;
       }
     } else if (error instanceof Error) {
       errorMessage += `: ${error.message}`;
     } else {
       errorMessage += `: ${String(error)}`;
     }
 
     throw new ExtendedMcpError(errorCode, errorMessage);
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
       {
         name: "create_content_type",
         description: "Create a new content type using the Content-Type Builder API (Requires Admin privileges).",
         inputSchema: {
           type: "object",
           properties: {
             displayName: { type: "string", description: "Display name for the content type (e.g., 'My Product')." },
             singularName: { type: "string", description: "Singular name (e.g., 'Product'). Used for API ID generation." },
             pluralName: { type: "string", description: "Plural name (e.g., 'Products'). Used for API ID and collection name generation." },
             kind: { type: "string", enum: ["collectionType", "singleType"], default: "collectionType", description: "Kind of content type." },
             description: { type: "string", description: "Optional description for the content type." },
             draftAndPublish: { type: "boolean", default: true, description: "Enable draft and publish system?" },
             attributes: {
               type: "object",
               description: "Object defining the fields (attributes) for the content type. Example: { \"title\": { \"type\": \"string\", \"required\": true }, \"price\": { \"type\": \"decimal\" } }",
               additionalProperties: {
                 type: "object",
                 properties: {
                   type: { type: "string", description: "Field type (e.g., string, text, richtext, email, password, number, decimal, float, date, time, datetime, boolean, json, relation, component, media, enumeration, uid)" },
                   required: { type: "boolean" },
                   // Add other common attribute properties as needed
                 },
                 required: ["type"]
               }
             }
           },
           required: ["displayName", "singularName", "pluralName", "attributes"]
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
 
       case "create_content_type": {
         const contentTypeData = request.params.arguments;
         if (!contentTypeData || typeof contentTypeData !== 'object') {
           throw new McpError(ErrorCode.InvalidParams, "Content type data object is required.");
         }
         // We pass the whole arguments object to the function
         const creationResult = await createContentType(contentTypeData);
         return {
           content: [{
             type: "text",
             text: JSON.stringify(creationResult, null, 2)
           }]
         };
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
