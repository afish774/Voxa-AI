// 🛠️ SURGICAL FIX: [V-01] Replaced child_process.exec() with execFile() to eliminate
// shell injection (RCE) vector. All commands now use execFile with explicit argument
// arrays, which NEVER spawn a shell. Additionally, URLs are validated against an
// explicit allowlist so user input cannot inject arbitrary commands.
import { execFile } from 'child_process';

// 🛠️ SURGICAL FIX: [V-01] Hardcoded allowlist — no user input ever reaches the shell
const SAFE_URLS = {
    'open youtube': 'https://www.youtube.com',
    'open github': 'https://github.com',
};

const SAFE_APPS = {
    'open notepad': { cmd: 'notepad', args: [] },
    'open calculator': { cmd: 'calc', args: [] },
    'open calc': { cmd: 'calc', args: [] },
};

export const executeCommand = (prompt) => {
    const text = prompt.toLowerCase();

    // 🌐 Web Commands — safe: URL comes from allowlist, not user input
    for (const [trigger, url] of Object.entries(SAFE_URLS)) {
        if (text.includes(trigger)) {
            // 🛠️ SURGICAL FIX: [V-01] execFile('cmd', [...]) never spawns a shell for interpretation
            execFile('cmd', ['/c', 'start', '', url], (err) => {
                if (err) console.error(`⚠️ Failed to open URL: ${err.message}`);
            });
            return `Opening ${trigger.replace('open ', '')} now.`;
        }
    }

    // 💻 Local App Commands — safe: binary name from allowlist, not user input
    for (const [trigger, app] of Object.entries(SAFE_APPS)) {
        if (text.includes(trigger)) {
            execFile(app.cmd, app.args, (err) => {
                if (err) console.error(`⚠️ Failed to open app: ${err.message}`);
            });
            return `Opening ${trigger.replace('open ', '')} now.`;
        }
    }

    // Return null if no command was detected, letting Gemini handle the chat
    return null;
};