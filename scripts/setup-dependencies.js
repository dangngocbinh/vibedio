#!/usr/bin/env node

/**
 * Script tự động cài đặt tất cả dependencies cho project
 * Hỗ trợ: Node.js (package.json) và Python (requirements.txt)
 * 
 * Cách sử dụng:
 *   node .agent/setup-dependencies.js
 *   hoặc: npm run setup:all
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Màu sắc cho console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

/**
 * In ra console với màu
 */
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Thực thi command và hiển thị output
 */
function runCommand(command, cwd) {
    try {
        log(`\n  └─ Running: ${command}`, 'cyan');
        execSync(command, {
            cwd,
            stdio: 'inherit', // Hiển thị output trực tiếp
            encoding: 'utf8'
        });
        return true;
    } catch (error) {
        log(`  ✗ Error: ${error.message}`, 'red');
        return false;
    }
}

/**
 * Tìm tất cả các file theo pattern trong directory
 */
function findFiles(dir, pattern, results = []) {
    // Bỏ qua các thư mục không cần thiết
    const excludeDirs = ['node_modules', 'venv', '.git', 'dist', 'build', 'out', '__pycache__'];

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Bỏ qua các thư mục excluded
            if (!excludeDirs.includes(file)) {
                findFiles(filePath, pattern, results);
            }
        } else if (stat.isFile() && file === pattern) {
            results.push(filePath);
        }
    }

    return results;
}

/**
 * Kiểm tra command có tồn tại không
 */
function commandExists(command) {
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Kiểm tra các phụ thuộc hệ thống (ffmpeg, ffprobe)
 */
function checkSystemDependencies() {
    log('\n🔍 Checking System Dependencies...', 'bold');

    const dependencies = ['ffmpeg', 'ffprobe'];
    let allFound = true;

    for (const dep of dependencies) {
        if (commandExists(dep)) {
            log(`  ✓ ${dep} found`, 'green');
        } else {
            log(`  ✗ ${dep} NOT found`, 'red');
            allFound = false;
        }
    }

    if (!allFound) {
        log('\n⚠️  Warning: Missing system dependencies.', 'yellow');
        log('   Please install ffmpeg and ffprobe to ensure all features work correctly.', 'yellow');
        log('   Hint: brew install ffmpeg (on macOS)', 'cyan');
    } else {
        log('  All system dependencies are met.', 'green');
    }
}

/**
 * Cài đặt Node.js dependencies
 */
function installNodeDependencies(projectRoot) {
    log('\n📦 Installing Node.js Dependencies...', 'bold');

    // Tìm tất cả package.json
    const packageFiles = findFiles(projectRoot, 'package.json');

    if (packageFiles.length === 0) {
        log('  No package.json found', 'yellow');
        return;
    }

    log(`  Found ${packageFiles.length} package.json file(s)`, 'blue');

    let successCount = 0;
    let failCount = 0;

    for (const packageFile of packageFiles) {
        const dir = path.dirname(packageFile);
        const relativePath = path.relative(projectRoot, dir);

        log(`\n  ► Installing: ${relativePath || 'root'}`, 'green');

        // Kiểm tra xem đã có node_modules chưa
        const nodeModulesPath = path.join(dir, 'node_modules');
        const hasNodeModules = fs.existsSync(nodeModulesPath);

        if (hasNodeModules) {
            log(`    ℹ️  node_modules already exists, updating...`, 'yellow');
        }

        // Chạy npm install
        const success = runCommand('npm install', dir);

        if (success) {
            successCount++;
            log(`    ✓ Success`, 'green');
        } else {
            failCount++;
            log(`    ✗ Failed`, 'red');
        }
    }

    log(`\n  Summary: ${successCount} succeeded, ${failCount} failed`, 'bold');
}

/**
 * Cài đặt Python dependencies
 */
function installPythonDependencies(projectRoot) {
    log('\n🐍 Installing Python Dependencies...', 'bold');

    // Kiểm tra Python có được cài đặt không
    if (!commandExists('python3') && !commandExists('python')) {
        log('  ✗ Python not found. Please install Python first.', 'red');
        return;
    }

    const pythonCmd = commandExists('python3') ? 'python3' : 'python';

    // Tìm tất cả requirements.txt
    const requirementsFiles = findFiles(projectRoot, 'requirements.txt');

    if (requirementsFiles.length === 0) {
        log('  No requirements.txt found', 'yellow');
        return;
    }

    log(`  Found ${requirementsFiles.length} requirements.txt file(s)`, 'blue');

    let successCount = 0;
    let failCount = 0;

    for (const requirementsFile of requirementsFiles) {
        const dir = path.dirname(requirementsFile);
        const relativePath = path.relative(projectRoot, dir);

        log(`\n  ► Installing: ${relativePath || 'root'}`, 'green');

        // Kiểm tra xem có virtual environment không
        const venvPath = path.join(dir, 'venv');
        const hasVenv = fs.existsSync(venvPath);

        if (!hasVenv) {
            log(`    Creating virtual environment...`, 'yellow');
            runCommand(`${pythonCmd} -m venv venv`, dir);
        }

        // Đường dẫn tới pip trong venv
        const pipCmd = path.join(venvPath, 'bin', 'pip');

        // Cài đặt dependencies
        const success = runCommand(`${pipCmd} install -r requirements.txt`, dir);

        if (success) {
            successCount++;
            log(`    ✓ Success`, 'green');
        } else {
            failCount++;
            log(`    ✗ Failed`, 'red');
        }
    }

    log(`\n  Summary: ${successCount} succeeded, ${failCount} failed`, 'bold');
}

/**
 * Hiển thị thông tin skills được tìm thấy
 */
function displaySkillsInfo(projectRoot) {
    log('\n🎯 Detected Skills:', 'bold');

    const skillsDir = path.join(projectRoot, '.agent', 'skills');

    if (!fs.existsSync(skillsDir)) {
        log('  No skills directory found', 'yellow');
        return;
    }

    const skills = fs.readdirSync(skillsDir).filter(item => {
        const itemPath = path.join(skillsDir, item);
        return fs.statSync(itemPath).isDirectory();
    });

    for (const skill of skills) {
        const skillPath = path.join(skillsDir, skill);
        const hasPackageJson = fs.existsSync(path.join(skillPath, 'package.json'));
        const hasRequirements = fs.existsSync(path.join(skillPath, 'requirements.txt'));

        const types = [];
        if (hasPackageJson) types.push('Node.js');
        if (hasRequirements) types.push('Python');

        if (types.length > 0) {
            log(`  • ${skill} (${types.join(', ')})`, 'cyan');
        } else {
            log(`  • ${skill} (no dependencies)`, 'yellow');
        }
    }
}

/**
 * Main function
 */
function main() {
    const projectRoot = path.resolve(__dirname, '..');

    // Parse command-line arguments
    const args = process.argv.slice(2);
    const nodeOnly = args.includes('--node-only');
    const pythonOnly = args.includes('--python-only');

    log('\n╔════════════════════════════════════════════╗', 'bold');
    log('║   🚀 Automation Video - Setup Dependencies ║', 'bold');
    log('╚════════════════════════════════════════════╝', 'bold');

    log(`\nProject root: ${projectRoot}`, 'blue');

    // Kiểm tra hệ thống
    checkSystemDependencies();

    // Hiển thị thông tin skills
    displaySkillsInfo(projectRoot);

    // Cài đặt dependencies theo options
    if (pythonOnly) {
        log('\n  Mode: Python only', 'yellow');
        installPythonDependencies(projectRoot);
    } else if (nodeOnly) {
        log('\n  Mode: Node.js only', 'yellow');
        installNodeDependencies(projectRoot);
    } else {
        // Mặc định: cài cả hai
        installNodeDependencies(projectRoot);
        installPythonDependencies(projectRoot);
    }

    log('\n✨ Setup completed!', 'bold');
    log('═══════════════════════════════════════════════\n', 'bold');
}

// Chạy script
main();
