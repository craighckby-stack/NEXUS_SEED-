const DEFAULT_LOG_LEVEL = 'INFO';
const LOG_LEVELS = { 'DEBUG': 10, 'INFO': 20, 'WARN': 30, 'ERROR': 40, 'CRITICAL': 50 };

let currentThreshold = LOG_LEVELS[DEFAULT_LOG_LEVEL];
let isInitialized = false;

/**
 * Executes structured JSON logging to output streams based on level.
 * @param {string} levelName 
 * @param {string} name 
 * @param {string} module 
 * @param {string} message 
 */
function outputLog(levelName, name, module, message) {
    if (LOG_LEVELS[levelName] < currentThreshold) {
        return;
    }
    
    // Format timestamp as YYYY-MM-DDTHH:mm:ss+00:00, mirroring Python's standard formatting goal
    const timestamp = new Date().toISOString().replace('Z', '+00:00'); 
    
    const logEntry = {
        time: timestamp,
        level: levelName,
        name: name || 'ROOT',
        module: module || 'UNSPECIFIED',
        message: message
    };

    const output = JSON.stringify(logEntry);
    
    // Route higher severity logs to stderr, others to stdout
    if (LOG_LEVELS[levelName] >= LOG_LEVELS.WARN) {
        process.stderr.write(output + '\n');
    } else {
        process.stdout.write(output + '\n');
    }
}

const SystemLogger = {
    setLevel: (level) => {
        const requestedLevel = level.toUpperCase();
        if (LOG_LEVELS[requestedLevel]) {
            currentThreshold = LOG_LEVELS[requestedLevel];
        } else {
             SystemLogger.warn('System', 'LoggerSetup', `Invalid log level specified: ${level}. Keeping current level.`);
        }
    },
    debug: (name, module, message) => outputLog('DEBUG', name, module, message),
    info: (name, module, message) => outputLog('INFO', name, module, message),
    warn: (name, module, message) => outputLog('WARN', name, module, message),
    error: (name, module, message) => outputLog('ERROR', name, module, message),
    critical: (name, module, message) => outputLog('CRITICAL', name, module, message)
};

/**
 * Sets up a standardized root logger configuration (UNIFIER Protocol).
 * Prevents duplicate setup.
 * @param {string} level - Initial logging threshold (e.g., 'INFO').
 * @returns {object} The central SystemLogger instance.
 */
function setupRootLogger(level = DEFAULT_LOG_LEVEL) {
    if (isInitialized) {
        return SystemLogger; 
    }
    
    // Set initial level
    SystemLogger.setLevel(level);
    isInitialized = true;
    
    SystemLogger.info('System', 'LoggerSetup', `System root logging initialized at level ${level.toUpperCase()}.`);
    
    return SystemLogger;
}

module.exports = {
    setupRootLogger,
    Logger: SystemLogger
};