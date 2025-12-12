# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)
- Supabase for backend (auth and database)
- Tailwind CSS v4

## Project Structure

```
src/
├── app/           # Next.js App Router (pages, layouts)
├── components/ui/ # Reusable UI components
├── lib/           # Utilities and service clients (e.g., supabaseClient.ts)
├── design/        # Design tokens (colors, spacing, radii)
```

## Path Alias

Use `@/*` to import from `./src/*`:
```typescript
import { supabase } from '@/lib/supabaseClient';
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key