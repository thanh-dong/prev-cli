#!/bin/bash
set -eo pipefail

# Read hook input from stdin
input=$(cat)
cwd=$(echo "$input" | jq -r '.cwd // empty')

# Use CLAUDE_PROJECT_DIR if set, otherwise fall back to cwd from input
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$cwd}"

if [ -z "$PROJECT_DIR" ]; then
  exit 0
fi

PENDING_FILE="$PROJECT_DIR/.claude/pending-learnings.md"

if [ -f "$PENDING_FILE" ] && [ -s "$PENDING_FILE" ]; then
  line_count=$(wc -l < "$PENDING_FILE")
  echo "{\"systemMessage\": \"PENDING LEARNINGS DETECTED: You have pending learnings from previous sessions in .claude/pending-learnings.md ($line_count lines). Use /learn to review and integrate important items into CLAUDE.md, then clear the pending file.\"}"
else
  exit 0
fi
