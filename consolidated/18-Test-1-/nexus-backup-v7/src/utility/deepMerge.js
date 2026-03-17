// src/utility/deepMerge.js

const isObject = (item) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * Recursively merges source into target, crucial for updating nested configurations
 * without overwriting entire policy blocks.
 */
const deepMerge = (target, source) => {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                // Ensure target has the key or initialize it
                if (!(key in target) || typeof target[key] === 'undefined') {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
};

export { deepMerge };