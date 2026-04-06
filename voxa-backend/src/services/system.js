import { exec } from 'child_process';

export const executeCommand = (prompt) => {
    const text = prompt.toLowerCase();

    // 🌐 Web Commands
    if (text.includes('open youtube')) {
        exec('start https://www.youtube.com');
        return "Opening YouTube now.";
    }
    if (text.includes('open github')) {
        exec('start https://github.com');
        return "Launching GitHub.";
    }

    // 💻 Local App Commands
    if (text.includes('open notepad')) {
        exec('notepad');
        return "Opening Notepad.";
    }
    if (text.includes('open calculator') || text.includes('open calc')) {
        exec('calc');
        return "Bringing up the calculator.";
    }

    // Return null if no command was detected, letting Gemini handle the chat
    return null;
};