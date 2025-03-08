#!/usr/bin/env node

/**
 * This script generates an icon for the Strapi MCP server.
 * It creates a 512x512 pixel PNG image with a stylized representation
 * of Strapi and MCP integration.
 * 
 * Usage:
 * node generate-icon.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create a 512x512 pixel canvas
const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#4945FF'; // Strapi primary color
ctx.fillRect(0, 0, size, size);

// Draw a stylized "S" for Strapi
ctx.fillStyle = 'white';
ctx.beginPath();
// Draw an S-like shape
ctx.moveTo(size * 0.3, size * 0.25);
ctx.bezierCurveTo(
  size * 0.2, size * 0.25,
  size * 0.2, size * 0.4,
  size * 0.3, size * 0.4
);
ctx.bezierCurveTo(
  size * 0.4, size * 0.4,
  size * 0.4, size * 0.6,
  size * 0.3, size * 0.6
);
ctx.bezierCurveTo(
  size * 0.2, size * 0.6,
  size * 0.2, size * 0.75,
  size * 0.3, size * 0.75
);
ctx.lineWidth = size * 0.08;
ctx.strokeStyle = 'white';
ctx.stroke();

// Draw MCP connection lines
ctx.beginPath();
ctx.moveTo(size * 0.5, size * 0.3);
ctx.lineTo(size * 0.8, size * 0.3);
ctx.moveTo(size * 0.5, size * 0.5);
ctx.lineTo(size * 0.8, size * 0.5);
ctx.moveTo(size * 0.5, size * 0.7);
ctx.lineTo(size * 0.8, size * 0.7);
ctx.lineWidth = size * 0.03;
ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
ctx.stroke();

// Draw connection dots
function drawDot(x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
}

drawDot(size * 0.8, size * 0.3, size * 0.04);
drawDot(size * 0.8, size * 0.5, size * 0.04);
drawDot(size * 0.8, size * 0.7, size * 0.04);

// Add "MCP" text
ctx.font = `bold ${size * 0.1}px Arial`;
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.fillText("MCP", size * 0.7, size * 0.9);

// Save the image
const outputPath = path.join(__dirname, '..', 'icon.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log(`Icon generated and saved to: ${outputPath}`);
console.log('Remember to install the "canvas" package if you haven\'t already:');
console.log('npm install canvas');
