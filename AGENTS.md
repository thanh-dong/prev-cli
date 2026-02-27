# Agent Instructions

## Browser Automation

Use **bwsr** for headless browser automation. Always use headless mode for speed and CI compatibility.

### Quick Start

```bash
# Start browser daemon (reuses if already running)
bwsr start

# Get page snapshot with AI-friendly @refs
agent-browser --cdp $(bwsr cdp) snapshot -i -c

# Interact using @refs from snapshot
agent-browser --cdp $(bwsr cdp) click @e5
agent-browser --cdp $(bwsr cdp) fill @e3 "text"

# Screenshot and cleanup
agent-browser --cdp $(bwsr cdp) screenshot result.png
bwsr stop
```

### Key Commands

| Task | Command |
|------|---------|
| Navigate | `agent-browser --cdp $(bwsr cdp) open <url>` |
| Snapshot | `agent-browser --cdp $(bwsr cdp) snapshot -i -c` |
| Click | `agent-browser --cdp $(bwsr cdp) click @<ref>` |
| Fill | `agent-browser --cdp $(bwsr cdp) fill @<ref> "text"` |
| Screenshot | `agent-browser --cdp $(bwsr cdp) screenshot [path]` |
| Get text | `agent-browser --cdp $(bwsr cdp) get text @<ref>` |

### Important: Always Headless

```bash
# Ensure headless mode (default)
bwsr profile set default --headless

# For local HTTPS dev servers only:
bwsr profile set default --ignoreHTTPSErrors
```

Never use `--headed` unless explicitly debugging visual issues.
