import type Groq from 'groq-sdk';

export async function streamGroqText(
  completion: Awaited<ReturnType<Groq['chat']['completions']['create']>>,
  onToken: (value: string) => void,
) {
  let output = '';

  for await (const chunk of completion as AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>) {
    const token = chunk.choices?.[0]?.delta?.content ?? '';

    if (!token) {
      continue;
    }

    output += token;
    onToken(token);
  }

  return output;
}