import { z } from 'zod';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { ToolDefinition } from './index.js';

// --- Zod Schemas ---
const PdfFileSizeArgsSchema = z
  .object({
    path: z.string().min(1).describe('Relative path to the local PDF file.'),
  })
  .strict();

type PdfFileSizeArgs = z.infer<typeof PdfFileSizeArgsSchema>;

// --- Result Type Interfaces ---
interface PdfFileSizeResult {
  path: string;
  success: boolean;
  file_size_bytes?: number;
  file_size_mb?: string;
  error?: string;
}

// --- Helper Functions ---
// Formats bytes to human-readable format
const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2);
};

// --- Main Handler Function ---
export const handlePdfFileSizeFunc = async (
  args: unknown
): Promise<{ content: { type: string; text: string }[] }> => {
  let parsedArgs: PdfFileSizeArgs;
  
  try {
    parsedArgs = PdfFileSizeArgsSchema.parse(args);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid arguments: ${error.errors.map((e) => `${e.path.join('.')} (${e.message})`).join(', ')}`
      );
    }
    // Added fallback for non-Zod errors during parsing
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InvalidParams, `Argument validation failed: ${message}`);
  }

  const { path } = parsedArgs;
  let result: PdfFileSizeResult = { path, success: false };

  try {
    // Resolve path securely using the existing utility
    const safePath = resolvePath(path);
    
    // Get file stats
    const stats = await fs.stat(safePath);
    
    // Check if it's actually a file
    if (!stats.isFile()) {
      throw new Error('Path does not point to a file');
    }
    
    // Get file size
    const fileSizeBytes = stats.size;
    const fileSizeMb = formatFileSize(fileSizeBytes);
    
    result = {
      path,
      success: true,
      file_size_bytes: fileSizeBytes,
      file_size_mb: fileSizeMb,
    };
  } catch (error: unknown) {
    let errorMessage = `Failed to get file size for ${path}.`;
    
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        errorMessage = `File not found at '${path}'.`;
      } else {
        errorMessage += ` Reason: ${error.message}`;
      }
    } else {
      errorMessage += ` Unknown error: ${JSON.stringify(error)}`;
    }
    
    result.error = errorMessage;
    result.success = false;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};

// Export the consolidated ToolDefinition
export const pdfFileSizeToolDefinition: ToolDefinition = {
  name: 'pdf_file_size',
  description: 'Gets the file size of a PDF file in bytes and megabytes.',
  schema: PdfFileSizeArgsSchema,
  handler: handlePdfFileSizeFunc,
};
