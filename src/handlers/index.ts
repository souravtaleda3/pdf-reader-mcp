// Import the consolidated PDF tool definitions
import { readPdfToolDefinition } from './readPdf.js';
import { pdfFileSizeToolDefinition } from './pdfFileSize.js';

// Define the structure for a tool definition (used internally and for index.ts)
// We need Zod here to define the schema type correctly
import type { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodType<unknown>; // Use Zod schema type with unknown
  // Define the specific return type expected by the SDK for tool handlers
  handler: (args: unknown) => Promise<{ content: { type: string; text: string }[] }>;
}

// Aggregate all tool definitions
export const allToolDefinitions: ToolDefinition[] = [
  readPdfToolDefinition,
  pdfFileSizeToolDefinition,
];
