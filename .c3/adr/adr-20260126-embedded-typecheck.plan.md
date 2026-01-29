# Execution Plan: Embedded TypeScript Type Checker

**ADR:** adr-20260126-embedded-typecheck
**Created:** 2026-01-26

## Pre-Execution Checklist

- [x] ADR status: accepted
- [ ] All affected files identified
- [ ] No conflicts with other pending changes

## Execution Steps

### Step 1: Documentation (C3 Docs)

1.1. Create `c3-104-typechecker.md` component documentation
1.2. Update `c3-1-cli/README.md` - add command and component to tables
1.3. Update `c3-101-cli-entry.md` - add typecheck to command table

### Step 2: Implementation (Code)

2.1. Create `src/typecheck/index.ts` - main typecheck module
2.2. Modify `src/cli.ts` - add typecheck case to switch

### Step 3: Dependencies

3.1. Modify `package.json` - move types to dependencies, add native-preview

## Verification

```bash
# Build
bun run build

# Test typecheck command
bun ./dist/cli.js typecheck

# Verify bunx works (simulate fresh install)
bunx prev-cli typecheck
```

## Rollback

If issues arise:
1. Revert code changes via git
2. Update ADR status to `rejected` with reason
