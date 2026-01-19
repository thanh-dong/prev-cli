#!/bin/bash
set -eo pipefail

# Read hook input from stdin
input=$(cat)
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')

# Use CLAUDE_PROJECT_DIR if set, otherwise fall back to cwd from input
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$cwd}"

if [ -z "$PROJECT_DIR" ]; then
  exit 0
fi

if [ -z "$transcript_path" ] || [ ! -f "$transcript_path" ]; then
  exit 0
fi

PENDING_FILE="$PROJECT_DIR/.claude/pending-learnings.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Extract potential learnings from transcript using pattern matching
# Look for development-relevant keywords and context
learnings=$(grep -iE '(learned|important|note:|remember|tip:|caveat:|bug:|fix:|workaround:|gotcha:|always|never|must|critical|key insight|discovered|turns out|actually|the trick is|solution was|root cause|debugging tip|pro tip)' "$transcript_path" 2>/dev/null || true)

if [ -n "$learnings" ]; then
  {
    echo ""
    echo "## Session Learnings - $TIMESTAMP"
    echo ""
    echo "**Review and integrate relevant items into CLAUDE.md:**"
    echo ""
    echo "$learnings" | head -50 | while read -r line; do
      # Clean up and format as bullet points
      cleaned=$(echo "$line" | sed 's/^[[:space:]]*//' | head -c 500)
      if [ -n "$cleaned" ]; then
        echo "- $cleaned"
      fi
    done
    echo ""
    echo "---"
  } >> "$PENDING_FILE"

  echo '{"systemMessage": "Session learnings captured to .claude/pending-learnings.md for review."}'
else
  echo '{"systemMessage": "No notable learnings detected in this session."}'
fi

exit 0
