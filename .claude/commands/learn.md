---
name: learn
description: Extract and integrate development learnings into CLAUDE.md
---

# Incremental Learning Command

You are tasked with extracting important development learnings from the current session and integrating them into the project's CLAUDE.md file.

## Process

### Step 1: Recall and Analyze Context

Review the current conversation context. Focus EXCLUSIVELY on learnings related to:

1. **Development Process** - workflow improvements, tooling discoveries, build/test patterns
2. **Debugging Insights** - techniques that worked, error patterns, troubleshooting steps
3. **Critical Codebase Information** - architectural decisions, gotchas, non-obvious dependencies
4. **Development Routines** - commands, sequences, environment setup
5. **Troubleshooting Patterns** - common issues and their resolutions

### Step 2: Extract Learnings

For each learning identified:
- Be specific and actionable
- Include the context of WHY this matters
- **IMPORTANT**: If a fact is critical, write it twice - once in the main description and once as a separate emphasized note

Format learnings as:
```
## [Category]

[Specific learning with context]

**IMPORTANT**: [Restate critical facts that must not be missed]
```

### Step 3: Check Pending Learnings

Read `.claude/pending-learnings.md` if it exists. This file contains auto-captured patterns from previous sessions that need review.

### Step 4: Update CLAUDE.md

1. Read the current CLAUDE.md file
2. Identify the appropriate section for each learning (or create new sections)
3. Integrate learnings that are:
   - Novel (not already documented)
   - Specific to this project
   - Actionable and useful for future development
4. Use the Edit tool to add the learnings
5. Maintain the existing structure and style of CLAUDE.md

### Step 5: Clear Processed Pending Learnings

After integrating learnings from `.claude/pending-learnings.md`, clear or remove entries that have been processed.

## Quality Criteria

**DO capture:**
- Commands or flags that solved specific problems
- Error messages and their resolutions
- Non-obvious behavior of tools or libraries
- Performance considerations discovered
- API quirks or undocumented behavior
- Test patterns that work well

**DO NOT capture:**
- Generic programming knowledge
- Information already well-documented elsewhere
- Temporary fixes or workarounds that will be removed
- User preferences that aren't development-relevant

## Output

After completing the integration:
1. Summarize what was added to CLAUDE.md
2. Note any pending learnings that were skipped and why
3. Confirm the CLAUDE.md file has been updated

Begin by analyzing the current session context for development learnings.
