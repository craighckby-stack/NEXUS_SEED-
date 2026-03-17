/**
 * Centralized configuration for telecommunication standards and limits.
 * Allows easy modification of carrier limits (e.g., segment sizes) without touching business logic.
 */

module.exports = {
    SMS: {
        GSM_7BIT: {
            LIMITS: { single: 160, multi: 153 },
            BASIC_CHARS_REGEX: /[A-Za-z0-9\s!"#\$%&'\(\)\*\+,\-\.\/:;<=>\?@£¥èéùìòÇØøÅåΔΓΛΩΠΨΣΘΞÆæßÉñÑ¿¡\r\n]/g,
            EXTENDED_CHARS: ['\f', '^', '{', '}', '\\', '[', '~', ']', '|', '€'],
        },
        UCS2_16BIT: {
            LIMITS: { single: 70, multi: 67 }
        }
    },
    // Future extensions for MMS, push notifications, etc.
    MMS: {},
    PUSH_NOTIFICATION: {}
};
