/**
 * Logger utility for standardized logging across the application
 */

enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

interface LogMessage {
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    data?: any;
}

export class Logger {
    private static formatMessage(level: LogLevel, service: string, message: string, data?: any): LogMessage {
        return {
            timestamp: new Date().toISOString(),
            level,
            service,
            message,
            data,
        };
    }

    static debug(service: string, message: string, data?: any): void {
        const logMessage = this.formatMessage(LogLevel.DEBUG, service, message, data);
        console.log(`[${logMessage.timestamp}] [${logMessage.level}] [${logMessage.service}] ${logMessage.message}`);
        if (data) console.log(JSON.stringify(data, null, 2));
    }

    static info(service: string, message: string, data?: any): void {
        const logMessage = this.formatMessage(LogLevel.INFO, service, message, data);
        console.log(`[${logMessage.timestamp}] [${logMessage.level}] [${logMessage.service}] ${logMessage.message}`);
        if (data) console.log(JSON.stringify(data, null, 2));
    }

    static warn(service: string, message: string, data?: any): void {
        const logMessage = this.formatMessage(LogLevel.WARN, service, message, data);
        console.warn(`[${logMessage.timestamp}] [${logMessage.level}] [${logMessage.service}] ${logMessage.message}`);
        if (data) console.warn(JSON.stringify(data, null, 2));
    }

    static error(service: string, message: string, error?: any): void {
        const logMessage = this.formatMessage(LogLevel.ERROR, service, message, {
            errorMessage: error?.message,
            stack: error?.stack,
        });
        console.error(`[${logMessage.timestamp}] [${logMessage.level}] [${logMessage.service}] ${logMessage.message}`);
        if (error) {
            console.error(`Error details: ${error.message}`);
            if (error.stack) console.error(error.stack);
        }
    }
}
