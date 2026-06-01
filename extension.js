const vscode = require('vscode');

// ===========
// СЕКУНДОМЕР
// ===========

let timerInterval = null;
let seconds = 0;
let statusBarItem = null;
let isRunning = false;

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    if (statusBarItem) {
        statusBarItem.text = `$(watch) ${formatTime(seconds)}`;
        if (isRunning) {
            statusBarItem.tooltip = "Таймер запущен - Нажмите для управления";
        } else {
            statusBarItem.tooltip = "Таймер на паузе - Нажмите для управления";
        }
    }
}

function saveState(context) {
    if (context && context.globalState) {
        context.globalState.update('timerSeconds', seconds);
        context.globalState.update('timerIsRunning', isRunning);
    }
}

function loadState(context) {
    if (context && context.globalState) {
        seconds = context.globalState.get('timerSeconds', 0);
        isRunning = context.globalState.get('timerIsRunning', false);
        
        updateTimerDisplay();
        
        if (isRunning) {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            timerInterval = setInterval(() => {
                seconds++;
                updateTimerDisplay();
                if (context) saveState(context);
            }, 1000);
        }
    }
}

function startTimer(context) {
    if (timerInterval) return;
    
    isRunning = true;
    timerInterval = setInterval(() => {
        seconds++;
        updateTimerDisplay();
        if (context) saveState(context);
    }, 1000);
    
    vscode.window.showInformationMessage('Секундомер запущен');
    updateTimerDisplay();
    if (context) saveState(context);
}

function stopTimer(context) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        vscode.window.showInformationMessage('Секундомер остановлен');
        updateTimerDisplay();
        if (context) saveState(context);
    }
}

function resetTimer(context) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    seconds = 0;
    isRunning = false;
    updateTimerDisplay();
    vscode.window.showInformationMessage('Секундомер сброшен');
    if (context) saveState(context);
}

// =====================
// АКТИВАЦИЯ РАСШИРЕНИЯ
// =====================

function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.tooltip = "Timer Helper - Управление секундомером";
    statusBarItem.show();
    
    loadState(context);
    
    statusBarItem.command = 'timerHelper.showMenu';
    
    const startCommand = vscode.commands.registerCommand('timerHelper.start', () => startTimer(context));
    const stopCommand = vscode.commands.registerCommand('timerHelper.stop', () => stopTimer(context));
    const resetCommand = vscode.commands.registerCommand('timerHelper.reset', () => resetTimer(context));
    
    const showMenuCommand = vscode.commands.registerCommand('timerHelper.showMenu', async () => {
        const choice = await vscode.window.showQuickPick(
            [
                { label: "Запустить", description: isRunning ? "Таймер уже запущен" : "Запустить секундомер", command: "start" },
                { label: "Остановить", description: !isRunning ? "Таймер уже остановлен" : "Остановить секундомер", command: "stop" },
                { label: "Сбросить", description: `Сбросить время (${formatTime(seconds)})`, command: "reset" }
            ],
            { placeHolder: "Управление секундомером" }
        );
        
        if (choice) {
            switch (choice.command) {
                case 'start': startTimer(context); break;
                case 'stop': stopTimer(context); break;
                case 'reset': resetTimer(context); break;
            }
        }
    });
    
    context.subscriptions.push(statusBarItem, startCommand, stopCommand, resetCommand, showMenuCommand);
}

function deactivate() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

module.exports = { activate, deactivate };