/**
 * Core module for calculating detailed SMS segment metadata, handling GSM 7-bit and UCS-2 16-bit encoding.
 * This module detects encoding, accounts for extended GSM characters, and calculates precise segment counts.
 *
 * @module SmsSegmentCalculator
 */

// --- Configuration Constants ---

const CONFIG = {
    // Defines GSM 7-bit standards and character sets
    GSM: {
        LIMITS: { single: 160, multi: 153 },
        // Regex defining all characters in the basic 7-bit alphabet, including control chars (CR/LF).
        BASIC_CHARS_REGEX: /[A-Za-z0-9\s!"#\$%&'\(\)\*\+,\-\.\/:;<=>\?@£¥èéùìòÇØøÅåΔΓΛΩΠΨΣΘΞÆæßÉñÑ¿¡\r\n]/g,
        // Characters that count as two GSM characters (escape sequences)
        EXTENDED_CHARS: ['\f', '^', '{', '}', '\\', '[', '~', ']', '|', '€'],
    },
    // Defines UCS-2 (16-bit) standards
    UCS2: {
        LIMITS: { single: 70, multi: 67 }
    }
};

// Pre-calculate escaped regex for extended characters. Used for length calculation and UCS-2 detection.
const EXTENDED_CHARS_REGEX = new RegExp(`[${CONFIG.GSM.EXTENDED_CHARS.map(c => {
    // Ensure proper escaping for regex control characters
    return c.replace(/([.*+?^$(){}|[\]\\])/g, '\\$1');
}).join('')}]`, 'g');


/**
 * Helper to perform basic handlebars-style variable substitution.
 * @param {string} templateContent
 * @param {Object} data
 * @returns {string} The fully rendered message string.
 */
function _renderBasicTemplate(templateContent, data) {
    if (!data || Object.keys(data).length === 0) {
        return templateContent;
    }
    
    return Object.entries(data).reduce((msg, [key, value]) => {
        // Coerce value to string, handling null/undefined safely
        const replacement = String(value ?? '');
        // Regex handles {{key}}, {{ key }}, {{key }} whitespace variation
        const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
        return msg.replace(regex, replacement);
    }, templateContent);
}


/**
 * Calculates the effective length of the message under GSM 7-bit encoding,
 * accounting for extended characters counting as 2.
 * @param {string} message
 * @returns {number} The effective length in GSM 7-bit units.
 */
function _calculateGsmLength(message) {
    let length = message.length;
    
    // Increment length by 1 for every extended character match
    const extendedMatches = message.match(EXTENDED_CHARS_REGEX);
    if (extendedMatches) {
        length += extendedMatches.length;
    }
    return length;
}


/**
 * Determines if the message requires UCS-2 encoding by iteratively stripping all known GSM characters.
 * @param {string} message
 * @returns {boolean} True if UCS-2 is required.
 */
function _requiresUcs2Encoding(message) {
    let checkStr = message;
    
    // 1. Strip basic GSM alphabet characters.
    checkStr = checkStr.replace(CONFIG.GSM.BASIC_CHARS_REGEX, '');
    
    // 2. Strip extended GSM alphabet characters.
    checkStr = checkStr.replace(EXTENDED_CHARS_REGEX, '');
    
    // If any character remains, they force UCS-2 (16-bit).
    return checkStr.length > 0;
}


/**
 * Core utility function to calculate detailed SMS segment metadata.
 *
 * @param {Object} params
 * @param {string} params.content - The raw template content string.
 * @param {Object} [params.data={}] - Input data for variable substitution.
 * @returns {{segments: number, encoding: 'GSM'|'UCS2'|'N/A', characterCount: number}} Calculation details.
 */
function calculateSmsSegments({ content, data = {} }) {
    if (!content) {
        return { segments: 0, encoding: 'N/A', characterCount: 0 };
    }
    
    const finalMessage = _renderBasicTemplate(content, data);
    
    let length, limits, encoding;

    if (_requiresUcs2Encoding(finalMessage)) {
        encoding = 'UCS2';
        length = finalMessage.length; 
        limits = CONFIG.UCS2.LIMITS;
    } else {
        encoding = 'GSM';
        length = _calculateGsmLength(finalMessage);
        limits = CONFIG.GSM.LIMITS;
    }

    let segments;
    
    // Calculate segments
    if (length === 0) {
        segments = 0;
    } else if (length <= limits.single) {
        segments = 1;
    } else {
        // Multi-segment calculation: Math.ceil(Total_Chars / Concatenation_Limit)
        segments = Math.ceil(length / limits.multi);
    }
    
    return { 
        segments,
        encoding,
        characterCount: length 
    };
}


module.exports = {
    calculateSmsSegments,
    // Expose segment calculation limits for external systems (e.g., config checks, testing)
    SMS_SEGMENT_LIMITS: {
        GSM: CONFIG.GSM.LIMITS,
        UCS2: CONFIG.UCS2.LIMITS
    }
};