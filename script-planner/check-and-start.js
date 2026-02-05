#!/usr/bin/env node

/**
 * Smart Script Planner Launcher
 *
 * Checks if Script Planner is already running before starting new instances.
 * This prevents port conflicts and ensures correct links are shown.
 *
 * Usage:
 *   node check-and-start.js
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

const VITE_PORT = 3002;
const API_PORT = 3003;
const VITE_URL = `http://localhost:${VITE_PORT}`;
const API_URL = `http://localhost:${API_PORT}`;

/**
 * Check if a port is in use
 */
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // Port is in use
            } else {
                resolve(false);
            }
        });

        server.once('listening', () => {
            server.close();
            resolve(false); // Port is free
        });

        server.listen(port, '127.0.0.1');
    });
}

/**
 * Check if the services are actually responding (not just port occupied)
 * Uses simple TCP check - if port accepts connection, service is likely healthy
 */
async function isServiceHealthy(port) {
    return new Promise((resolve) => {
        const socket = net.createConnection({ port, host: '127.0.0.1' }, () => {
            socket.end();
            resolve(true);
        });

        socket.on('error', () => {
            resolve(false);
        });

        socket.setTimeout(2000, () => {
            socket.destroy();
            resolve(false);
        });
    });
}

/**
 * Start the services using npm run dev:all
 */
function startServices() {
    console.log('🚀 Starting Script Planner services...\n');

    const child = spawn('npm', ['run', 'dev:all'], {
        stdio: 'inherit',
        shell: true
    });

    child.on('error', (error) => {
        console.error('❌ Failed to start services:', error.message);
        process.exit(1);
    });

    // Don't exit parent process when child starts
    child.unref();

    // Wait a bit for services to start
    setTimeout(() => {
        console.log('\n✅ Script Planner services started!');
        showLinks();
        console.log('\n💡 Tip: Services will continue running in the background.');
        console.log('   To stop: pkill -f "vite|script-planner"\n');
    }, 3000);
}

/**
 * Show the access links
 */
function showLinks(projectSlug = null) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║           Script Planner is Ready!                    ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    const projectParam = projectSlug ? `?project=${projectSlug}` : '';
    const fullUrl = `${VITE_URL}${projectParam}`;

    console.log('🌐 Frontend:  ' + VITE_URL);
    console.log('🔧 API:       ' + API_URL);

    if (projectSlug) {
        console.log('📂 Project:   ' + projectSlug);
    }

    console.log('\n🔗 Open in browser:\n');
    console.log('   ' + fullUrl);
    console.log('');
}

/**
 * Main function
 */
async function main() {
    console.log('🔍 Checking Script Planner status...\n');

    // Check both ports
    const viteInUse = await isPortInUse(VITE_PORT);
    const apiInUse = await isPortInUse(API_PORT);

    console.log(`   Port ${VITE_PORT} (Vite):  ${viteInUse ? '✅ In use' : '⚪ Free'}`);
    console.log(`   Port ${API_PORT} (API):   ${apiInUse ? '✅ In use' : '⚪ Free'}`);
    console.log('');

    // If both ports are in use, check if they're actually our services
    if (viteInUse && apiInUse) {
        console.log('🔍 Verifying services health...\n');

        const viteHealthy = await isServiceHealthy(VITE_PORT);
        const apiHealthy = await isServiceHealthy(API_PORT);

        if (viteHealthy && apiHealthy) {
            console.log('✅ Script Planner is already running!\n');

            // Extract project slug from command line args if provided
            const args = process.argv.slice(2);
            const projectArg = args.find(arg => arg.startsWith('--project='));
            const projectSlug = projectArg ? projectArg.split('=')[1] : null;

            showLinks(projectSlug);

            console.log('💡 Tip: No need to start again. Services are healthy.\n');
            process.exit(0);
        } else {
            console.log('⚠️  Ports are occupied but services not responding.');
            console.log('    This might be leftover processes or different services.\n');
            console.log('Options:');
            console.log('  1. Kill existing processes: pkill -f "vite|script-planner"');
            console.log('  2. Use different ports (edit vite.config.ts and server.js)');
            console.log('  3. Force start anyway (may conflict)\n');

            const readline = await import('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('Kill existing processes and restart? (y/N): ', (answer) => {
                if (answer.toLowerCase() === 'y') {
                    console.log('\n🔄 Killing existing processes...\n');
                    exec('pkill -f "vite.*3002|node.*server.js"', (error) => {
                        if (error && !error.message.includes('No matching processes')) {
                            console.error('⚠️  Error killing processes:', error.message);
                        }

                        // Wait a bit for processes to die
                        setTimeout(() => {
                            startServices();
                        }, 1000);
                    });
                } else {
                    console.log('\n❌ Cancelled. Ports remain occupied.\n');
                    process.exit(1);
                }
                rl.close();
            });
        }
    } else if (!viteInUse && !apiInUse) {
        // Both ports are free, start services
        startServices();
    } else {
        // One port is free, one is occupied - problematic
        console.log('⚠️  Partial conflict detected!\n');
        console.log('One service seems to be running but not both.');
        console.log('This might cause issues. Recommend killing all and restarting.\n');

        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Kill all and restart? (y/N): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
                console.log('\n🔄 Cleaning up...\n');
                exec('pkill -f "vite.*3002|node.*server.js"', (error) => {
                    setTimeout(() => {
                        startServices();
                    }, 1000);
                });
            } else {
                console.log('\n❌ Cancelled.\n');
                process.exit(1);
            }
            rl.close();
        });
    }
}

// Run
main().catch(error => {
    console.error('💥 Error:', error.message);
    process.exit(1);
});
