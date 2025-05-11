/**
 * Custom API Error class for standardized error responses
 * @extends Error
 */
class ApiError extends Error {
    /**
     * Create a new API error
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {Array} errors - List of validation errors
     * @param {string} stack - Error stack trace
     */
    constructor(
        statusCode = 500,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.success = false;
        this.data = null;

        // Set stack trace
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Returns the error as a structured object for response
     * @returns {Object} Formatted error object
     */
    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            errors: this.errors.length > 0 ? this.errors : undefined,
            data: this.data
        };
    }
}

export { ApiError };