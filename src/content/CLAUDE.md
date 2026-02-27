<!-- c3-generated: c3-202, c3-203 -->
# Content Scanning

Before modifying this code, read:
- `.c3/c3-2-build/c3-202-pages-plugin.md` - Page discovery & sidebar
- `.c3/c3-2-build/c3-203-previews-plugin.md` - Preview catalog discovery

Key modules:
- `pages.ts` - Scans markdown/MDX files, extracts frontmatter, builds sidebar tree
- `previews.ts` - Scans preview directories, builds preview catalog
- `config-parser.ts` - Parses flow/atlas YAML configurations
- `preview-types.ts` - TypeScript types for preview system
<!-- end-c3-generated -->
