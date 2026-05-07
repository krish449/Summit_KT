import 'server-only';

import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function extractTextFromFile(fileName: string, buffer: Buffer) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString('utf8');
}