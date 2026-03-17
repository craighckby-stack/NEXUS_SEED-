/**
 * @fileoverview Standardized result structure for command execution, necessary for reliable failure propagation.
 */

/**
 * Represents the standardized outcome of a command execution.
 */
class CommandResult {
    /**
     * @param {boolean} success
     * @param {string} commandName
     * @param {string} [message=""]
     * @param {Object.<string, any>} [details={}]
     * @param {number | null} [statusCode=null]
     */
    constructor(success, commandName, message = "", details = {}, statusCode = null) {
        this.success = success;
        this.commandName = commandName;
        this.message = message;
        this.details = details;
        this.statusCode = statusCode;
        // Simulating dataclass frozen=True
        Object.freeze(this);
    }

    /**
     * Creates a successful CommandResult.
     * @param {string} commandName
     * @param {string} [message="Execution successful."]
     * @param {Object.<string, any> | null} [details=null]
     * @returns {CommandResult}
     */
    static successResult(commandName, message = "Execution successful.", details = null) {
        return new CommandResult(
            true,
            commandName,
            message,
            details || {}
        );
    }

    /**
     * Creates a failed CommandResult.
     * @param {string} commandName
     * @param {string} reason
     * @param {Object.<string, any> | null} [details=null]
     * @param {number | null} [statusCode=null]
     * @returns {CommandResult}
     */
    static failureResult(commandName, reason, details = null, statusCode = null) {
        return new CommandResult(
            false,
            commandName,
            reason,
            details || {},
            statusCode
        );
    }
}

module.exports = { CommandResult };