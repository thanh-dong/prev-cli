<!-- c3-generated: c3-104 -->
# c3-104: Typechecker

Before modifying this code, read:
- Component: `.c3/c3-1-cli/c3-104-typechecker.md`

Key responsibilities:
- Resolve tsgo binary from prev-cli dependencies
- Resolve @types from prev-cli dependencies
- Run type checking without user-side configuration

Design: Uses `import.meta.resolve()` to find packages relative to prev-cli installation, not user project.
<!-- end-c3-generated -->
