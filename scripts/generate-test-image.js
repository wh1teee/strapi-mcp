#!/usr/bin/env node

/**
 * This script generates a base64-encoded test image that can be used
 * to test the upload_media tool in the Strapi MCP server.
 * 
 * Usage:
 * node generate-test-image.js
 */

// Create a simple 100x100 pixel red square as a PNG
const width = 100;
const height = 100;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Fill with red color
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, width, height);

// Add some text
ctx.fillStyle = 'white';
ctx.font = '16px Arial';
ctx.fillText('Test Image', 10, 50);

// Convert to base64
const base64Data = canvas.toDataURL('image/png');

// Output the base64-encoded image data
console.log('Base64-encoded test image:');
console.log(base64Data);
console.log('\nYou can use this data with the upload_media tool:');
console.log(`
use_mcp_tool(
  server_name: "strapi-mcp",
  tool_name: "upload_media",
  arguments: {
    "fileData": "${base64Data}",
    "fileName": "test-image.png",
    "fileType": "image/png"
  }
)
`);

// Helper function to create a canvas (simplified version)
function createCanvas(width, height) {
  // This is a simplified implementation that doesn't actually create a real canvas
  // but generates the expected output format
  return {
    width,
    height,
    getContext: () => ({
      fillStyle: '',
      font: '',
      fillRect: () => {},
      fillText: () => {},
    }),
    toDataURL: () => {
      // Return a tiny red dot PNG in base64
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
    }
  };
}
