# c3-211: Preview Server

## Source
`src/server/preview.ts`

## Purpose
Static file server for previewing production builds locally, serving from the `./dist` directory.

## Responsibilities
- Serve static files from `dist/` directory using Bun.serve()
- Handle directory index resolution (`/path/` -> `/path/index.html`)
- SPA fallback: serve `index.html` for non-file routes
- Validate `dist/` exists before starting (error if not built)

## Key Implementation Details
- Uses `Bun.file()` for zero-copy file serving
- Strips trailing slashes for consistent routing
- Path traversal protection: checks `filePath.startsWith(distDir)`
- Distinguishes files from directories using `statSync().isFile()`
- Lightweight: no build, no plugins, just static file serving

## Dependencies
- External: Bun.serve
