// Example implementation of Webhook Management for Strapi MCP

interface WebhookData {
  name: string;
  url: string;
  headers?: Record<string, string>;
  events: string[];
}

/**
 * List all webhooks in Strapi
 */
async function listWebhooks(): Promise<any[]> {
  try {
    console.error("[API] Fetching webhooks from Strapi");
    const response = await makeAdminApiRequest('/webhooks');
    return response || [];
  } catch (error: any) {
    console.error("[Error] Failed to fetch webhooks:", error);
    throw new ExtendedMcpError(ExtendedErrorCode.InternalError, `Failed to fetch webhooks: ${error.message}`);
  }
}

/**
 * Create a new webhook
 */
async function createWebhook(data: WebhookData): Promise<any> {
  try {
    console.error(`[API] Creating webhook: ${data.name}`);
    
    const webhookPayload = {
      name: data.name,
      url: data.url,
      headers: data.headers || {},
      events: data.events
    };
    
    const response = await makeAdminApiRequest('/webhooks', 'post', webhookPayload);
    console.error(`[API] Successfully created webhook: ${data.name}`);
    return response;
  } catch (error: any) {
    console.error(`[Error] Failed to create webhook ${data.name}:`, error);
    throw new ExtendedMcpError(ExtendedErrorCode.InternalError, `Failed to create webhook: ${error.message}`);
  }
}

/**
 * Update an existing webhook
 */
async function updateWebhook(id: string, data: WebhookData): Promise<any> {
  try {
    console.error(`[API] Updating webhook: ${id}`);
    
    const webhookPayload = {
      name: data.name,
      url: data.url,
      headers: data.headers || {},
      events: data.events
    };
    
    const response = await makeAdminApiRequest(`/webhooks/${id}`, 'put', webhookPayload);
    console.error(`[API] Successfully updated webhook: ${id}`);
    return response;
  } catch (error: any) {
    console.error(`[Error] Failed to update webhook ${id}:`, error);
    throw new ExtendedMcpError(ExtendedErrorCode.InternalError, `Failed to update webhook: ${error.message}`);
  }
}

/**
 * Delete a webhook
 */
async function deleteWebhook(id: string): Promise<void> {
  try {
    console.error(`[API] Deleting webhook: ${id}`);
    await makeAdminApiRequest(`/webhooks/${id}`, 'delete');
    console.error(`[API] Successfully deleted webhook: ${id}`);
  } catch (error: any) {
    console.error(`[Error] Failed to delete webhook ${id}:`, error);
    throw new ExtendedMcpError(ExtendedErrorCode.InternalError, `Failed to delete webhook: ${error.message}`);
  }
}

/**
 * Trigger a webhook manually
 */
async function triggerWebhook(id: string): Promise<any> {
  try {
    console.error(`[API] Triggering webhook: ${id}`);
    const response = await makeAdminApiRequest(`/webhooks/${id}/trigger`, 'post');
    console.error(`[API] Successfully triggered webhook: ${id}`);
    return response;
  } catch (error: any) {
    console.error(`[Error] Failed to trigger webhook ${id}:`, error);
    throw new ExtendedMcpError(ExtendedErrorCode.InternalError, `Failed to trigger webhook: ${error.message}`);
  }
}

// Add these to your tool handlers:
/*
case "list_webhooks": {
  const webhooks = await listWebhooks();
  return {
    content: [{
      type: "text",
      text: JSON.stringify(webhooks, null, 2)
    }]
  };
}

case "create_webhook": {
  const webhookData = request.params.arguments as WebhookData;
  if (!webhookData.name || !webhookData.url || !webhookData.events) {
    throw new McpError(ErrorCode.InvalidParams, "name, url, and events are required");
  }
  const webhook = await createWebhook(webhookData);
  return {
    content: [{
      type: "text", 
      text: JSON.stringify(webhook, null, 2)
    }]
  };
}
*/ 