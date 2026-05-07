# Summit KT Portal

Summit KT Portal is a production-oriented knowledge transfer portal built with Next.js 14, Supabase, Groq, and Tailwind CSS for enterprise team transitions.

## Stack

- Next.js 14 App Router + TypeScript
- Supabase Auth, Postgres, Storage, and pgvector
- Groq `llama-3.3-70b-versatile` for grounded KT chat
- Local embeddings with `@xenova/transformers`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

## Environment

Copy `.env.example` to `.env.local` and supply the required Supabase and Groq values.