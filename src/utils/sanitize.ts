/**
 * Input Sanitization Utilities
 * Prevents XSS and other injection attacks by sanitizing user input
 */

/**
 * Sanitizes a string by escaping HTML special characters
 * @param input - The string to sanitize
 * @returns Sanitized string safe for HTML display
 */
export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';

    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitizes a string for use in database queries
 * Removes potentially dangerous characters
 * @param input - The string to sanitize
 * @returns Sanitized string safe for database operations
 */
export function sanitizeForDb(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Remove null bytes and trim whitespace
    return input
        .replace(/\0/g, '')
        .trim();
}

/**
 * Validates and sanitizes an email address
 * @param email - The email to validate
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';

    const sanitized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitizes a name (removes special characters except spaces, hyphens, apostrophes)
 * @param name - The name to sanitize
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return '';

    return name
        .trim()
        .replace(/[^a-zA-Z\s'-]/g, '')
        .substring(0, 100); // Limit length
}

/**
 * Sanitizes a phone number (keeps only digits and common separators)
 * @param phone - The phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';

    return phone
        .trim()
        .replace(/[^0-9+\-\s()]/g, '')
        .substring(0, 20); // Limit length
}

/**
 * Validates a file type against allowed extensions
 * @param filename - The filename to check
 * @param allowedExtensions - Array of allowed extensions (e.g., ['jpg', 'png'])
 * @returns True if file type is allowed
 */
export function isAllowedFileType(
    filename: string,
    allowedExtensions: readonly string[]
): boolean {
    if (!filename || typeof filename !== 'string') return false;

    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return allowedExtensions.map(ext => ext.toLowerCase()).includes(extension);
}

/**
 * Sanitizes user-provided content for display
 * @param content - The content to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized content
 */
export function sanitizeUserContent(content: string, maxLength: number = 1000): string {
    if (!content || typeof content !== 'string') return '';

    return sanitizeHtml(content.trim().substring(0, maxLength));
}
