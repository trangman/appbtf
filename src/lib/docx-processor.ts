import * as mammoth from 'mammoth';

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const { value: text } = await mammoth.extractRawText({ buffer });
  return text;
} 