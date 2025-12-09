/**
 * Logger utility that only logs in development mode
 * Prevents console.log statements from appearing in production
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Development-only logger
 * All methods are no-ops in production
 */
export const logger = {
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    info: (...args: any[]) => {
        if (isDev) {
            console.info(...args);
        }
    },

    warn: (...args: any[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },

    error: (...args: any[]) => {
        // Always log errors (even in production for debugging)
        console.error(...args);
    },

    debug: (...args: any[]) => {
        if (isDev) {
            console.debug(...args);
        }
    },

    group: (label: string) => {
        if (isDev) {
            console.group(label);
        }
    },

    groupEnd: () => {
        if (isDev) {
            console.groupEnd();
        }
    },

    table: (data: any) => {
        if (isDev) {
            console.table(data);
        }
    },
};

// Type export for use in other files
export type Logger = typeof logger;
