# Smart Script Planner Launcher

## Problem

When running `npm run plan` multiple times, Vite automatically switches to the next available port if the default port (3002) is already in use. This causes:

1. **Wrong links shown** - Documentation shows port 3002, but actual port might be 3003, 3004, etc.
2. **Resource waste** - Multiple instances running when one is enough
3. **Confusion** - User doesn't know which port is actually active

## Solution

The `check-and-start.js` script intelligently handles Script Planner launches:

### Features

1. **Port Check** (TCP level)
   - Checks if port 3002 (Vite) and 3003 (API) are in use
   - Fast, doesn't require HTTP requests

2. **Health Verification**
   - Verifies services are actually responding
   - Distinguishes between healthy services and stale processes

3. **Smart Decision Making**
   - Both healthy → Show link only, don't restart
   - Both free → Start services
   - Partial conflict → Offer cleanup and restart
   - Unhealthy → Offer to kill and restart

4. **Interactive Prompts**
   - Asks user before killing processes
   - Provides clear options and commands

## Architecture

```
┌─────────────────────────────────────────┐
│  npm run plan                            │
│  └─> npm run dev:smart                  │
│      └─> node check-and-start.js        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  1. Check Port 3002 (Vite)              │
│  2. Check Port 3003 (API)               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Both in use?                            │
│  ├─ YES → Health check                  │
│  │   ├─ Healthy → Show link only        │
│  │   └─ Unhealthy → Offer restart       │
│  └─ NO → Start services                 │
└─────────────────────────────────────────┘
```

## Flow Diagram

### Scenario 1: Fresh Start (No services running)

```
User runs: npm run plan
    ↓
Check ports 3002 & 3003
    ↓
Both free
    ↓
Start: npm run dev:all
    ↓
Wait 3 seconds
    ↓
Show links:
  - http://localhost:3002 (Frontend)
  - http://localhost:3003 (API)
```

### Scenario 2: Already Running (Healthy)

```
User runs: npm run plan
    ↓
Check ports 3002 & 3003
    ↓
Both in use
    ↓
Health check
    ↓
Both healthy ✅
    ↓
Show message: "Already running!"
Show links (no restart needed)
```

### Scenario 3: Stale Processes

```
User runs: npm run plan
    ↓
Check ports 3002 & 3003
    ↓
Both in use
    ↓
Health check
    ↓
Not responding ❌
    ↓
Prompt: "Kill and restart? (y/N)"
    ↓
If yes:
  pkill -f "vite.*3002|node.*server.js"
  Wait 1s
  Start services
```

### Scenario 4: Partial Conflict

```
User runs: npm run plan
    ↓
Check ports 3002 & 3003
    ↓
One in use, one free ⚠️
    ↓
Prompt: "Kill all and restart? (y/N)"
    ↓
If yes:
  Clean up
  Start services
```

## Technical Details

### Port Detection

Uses Node.js `net.createServer()`:
```javascript
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // Port occupied
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(false); // Port free
        });
        server.listen(port, '127.0.0.1');
    });
}
```

**Why this method?**
- Fast (no HTTP overhead)
- Works even if HTTP endpoint not yet ready
- Reliable on all platforms

### Health Check

Uses TCP connection test:
```javascript
async function isServiceHealthy(port) {
    return new Promise((resolve) => {
        const socket = net.createConnection({ port, host: '127.0.0.1' }, () => {
            socket.end();
            resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.setTimeout(2000, () => {
            socket.destroy();
            resolve(false);
        });
    });
}
```

**Why TCP instead of HTTP?**
- No dependency on fetch API (Node 18+ only)
- Simpler, more reliable
- Faster response

### Process Management

Kill command pattern:
```bash
pkill -f "vite.*3002|node.*server.js"
```

**Pattern explanation:**
- `vite.*3002` - Matches Vite dev server on port 3002
- `node.*server.js` - Matches Node.js API server

**Why pkill?**
- Cross-platform (macOS, Linux)
- Pattern matching (regex)
- Graceful termination (SIGTERM first)

## Configuration

### Ports (in script)
```javascript
const VITE_PORT = 3002;  // Frontend
const API_PORT = 3003;   // Backend API
```

### Ports (in config files)

**Vite** (`script-planner/vite.config.ts`):
```javascript
server: {
    port: 3002,
    proxy: {
        '/api': {
            target: 'http://127.0.0.1:3003'
        }
    }
}
```

**Express** (`script-planner/server.js`):
```javascript
const PORT = 3003;
app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
});
```

## Testing

### Manual Test 1: Fresh Start
```bash
# Ensure nothing running
pkill -f "vite.*3002|node.*server.js"

# Should start services
npm run plan

# Expected output:
# 🔍 Checking...
# Both free
# 🚀 Starting services...
# ✅ Services started
# 🔗 http://localhost:3002
```

### Manual Test 2: Already Running
```bash
# Start once
npm run plan

# Wait for startup (3-5 seconds)

# Run again
npm run plan

# Expected output:
# 🔍 Checking...
# Both in use
# ✅ Already running!
# 🔗 http://localhost:3002
# (No restart)
```

### Manual Test 3: Stale Process
```bash
# Start services
npm run plan

# Manually kill only Vite (simulate partial failure)
pkill -f "vite.*3002"

# Run again
npm run plan

# Expected output:
# ⚠️ Partial conflict
# Prompt to restart
```

## Troubleshooting

### Port still showing as "in use" but nothing running

**Symptom:** Script says port in use, but no process visible.

**Cause:** Port might be held by system or crashed process.

**Solution:**
```bash
# Check what's using the port
lsof -i :3002
lsof -i :3003

# Kill by PID if found
kill -9 <PID>

# Or try restart
npm run plan
# Choose "y" to kill and restart
```

### Services start but immediately crash

**Symptom:** Script starts services, but health check fails.

**Possible causes:**
1. Node modules missing
2. Port permission issue
3. Config error

**Solutions:**
```bash
# 1. Reinstall dependencies
cd script-planner
npm install

# 2. Check Node version (need 16+)
node --version

# 3. Check for errors
npm run dev    # Test Vite separately
npm run server # Test API separately
```

### Wrong port shown in link

**Symptom:** Link shows 3002 but actual port is different.

**Cause:** This should not happen with the smart script. If it does:

1. Check `vite.config.ts` - port should be 3002
2. Check `server.js` - port should be 3003
3. Ensure you're running `npm run plan`, not `npm run dev:all` directly

## Migration from Old Method

### Old way (problematic):
```json
{
  "scripts": {
    "plan": "cd script-planner && npm run dev:all"
  }
}
```

**Issues:**
- Always starts new instance
- Port conflicts
- Wrong links

### New way (smart):
```json
{
  "scripts": {
    "plan": "cd script-planner && npm run dev:smart"
  }
}
```

**Benefits:**
- Checks before starting
- Reuses existing instance
- Correct links

## Future Enhancements

Potential improvements:

1. **PID Tracking**
   - Save PIDs to temp file
   - More reliable process detection

2. **Port Auto-Discovery**
   - If 3002/3003 unavailable, find next free ports
   - Update config dynamically

3. **Health Endpoints**
   - Add `/health` endpoints to both services
   - More sophisticated health checks

4. **Graceful Shutdown**
   - Handle SIGTERM/SIGINT properly
   - Clean shutdown on Ctrl+C

5. **Logging**
   - Log to file for debugging
   - Rotate logs automatically

## Related Files

- `script-planner/check-and-start.js` - This smart launcher script
- `script-planner/package.json` - Scripts configuration
- `script-planner/vite.config.ts` - Vite port config
- `script-planner/server.js` - Express API server
- `package.json` - Root package with `npm run plan` command
- `.claude/skills/video-production-director/SKILL.md` - Documentation

## Maintenance

### When to update this script?

1. **Port changes** - Update `VITE_PORT` and `API_PORT` constants
2. **Kill pattern changes** - Update pkill regex if process naming changes
3. **Timeout adjustments** - Modify health check timeout if needed

### Version History

- **v1.0.0** (2026-02-05) - Initial implementation
  - Port detection
  - Health checks
  - Smart restart logic
  - Interactive prompts

---

**Author:** Claude + User collaboration
**Date:** 2026-02-05
**Purpose:** Eliminate port conflicts and improve Script Planner UX
