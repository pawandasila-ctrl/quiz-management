<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Guidelines

1. **Always Follow .agents/skills**: Refer to guidelines in the `.agents/skills/` directory for React/Next.js best practices, UX/UI layout patterns, and reviews.
2. **React Server Components (RSC) by Default**:
   * Do NOT mark page-level component files (`page.tsx`) with `"use client";`. Keep pages as Server Components.
   * Fetch params or initial data server-side and pass them down as props to child components.
3. **Encapsulate Client Logic**:
   * Any client hooks (e.g. `useState`, `useQuery`, client routers, dynamic states) must be encapsulated inside smaller client components located inside `_components/` or a components folder.
   * Mark only these child client components with `"use client";`, then import and render them in the server page.
