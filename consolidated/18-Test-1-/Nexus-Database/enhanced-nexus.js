// BlochSphereBundle (IIFE structure, content extracted)
(function() {
  "use strict";

  // --- Enums & Interaction Modes ---
  const InteractionMode = {
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
  };

  const OrbitControlsMode = {
    ROTATE: 0,
    PAN: 1,
    DOLLY_PAN: 2,
    DOLLY_ROTATE: 3,
  };

  // --- WebGL Constants (Commonly found in THREE.js) ---
  const WebGLConstants = {
    // Blending, Depth, Stencil, etc.
    ZERO: 0,
    ONE: 1,
    ADD: 2,
    NEVER: 1,
    LESS: 2,
    EQUAL: 3,
    LEQUAL: 4,
    GREATER: 5,
    NOTEQUAL: 6,
    GEQUAL: 7,
    ALWAYS: 8,

    FRONT: 1028,
    BACK: 1029,
    FRONT_AND_BACK: 1032,

    SRC_ALPHA_SATURATE: 776,
    BLEND_EQUATION_RGB: 32777,
    BLEND_EQUATION_ALPHA: 34877,
    BLEND_DST_RGB: 32968,
    BLEND_SRC_RGB: 32969,
    BLEND_DST_ALPHA: 32970,
    BLEND_SRC_ALPHA: 32971,

    // Data Types
    BYTE: 5120,
    UNSIGNED_BYTE: 5121,
    SHORT: 5122,
    UNSIGNED_SHORT: 5123,
    INT: 5124,
    UNSIGNED_INT: 5125,
    FLOAT: 5126,
    HALF_FLOAT: 36193,
    UNSIGNED_SHORT_4_4_4_4: 32819,
    UNSIGNED_SHORT_5_5_5_1: 32820,
    UNSIGNED_SHORT_5_6_5: 33635,
    UNSIGNED_INT_2_10_10_10_REV: 33640,
    UNSIGNED_INT_24_8: 34042,
    UNSIGNED_INT_10F_11F_11F_REV: 35899,
    UNSIGNED_INT_5_9_9_9_REV: 35902,
    FLOAT_32_UNSIGNED_INT_24_8_REV: 36269,

    // Buffer Usage
    STATIC_DRAW: 35044,
    DYNAMIC_DRAW: 35048,
    STREAM_DRAW: 35040,

    // Textures
    TEXTURE_2D: 3553,
    TEXTURE_CUBE_MAP: 34067,
    TEXTURE_BINDING_2D: 32873,
    TEXTURE_BINDING_CUBE_MAP: 34068,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    TEXTURE_WRAP_R: 32882, // WebGL2
    REPEAT: 10497,
    CLAMP_TO_EDGE: 33071,
    MIRRORED_REPEAT: 33648,
    NEAREST: 9728,
    LINEAR: 9729,
    NEAREST_MIPMAP_NEAREST: 9984,
    LINEAR_MIPMAP_NEAREST: 9985,
    NEAREST_MIPMAP_LINEAR: 9986,
    LINEAR_MIPMAP_LINEAR: 9987,

    // Formats
    ALPHA: 6406,
    RGB: 6407,
    RGBA: 6408,
    LUMINANCE: 6409,
    LUMINANCE_ALPHA: 6410,
    DEPTH_COMPONENT: 6402,
    DEPTH_STENCIL: 34041,
    RED_INTEGER: 36244,
    RGB_INTEGER: 36248,
    RGBA_INTEGER: 36249,
    RG_INTEGER: 33320, // WebGL2

    // Internal Formats
    R8: 33321,
    R8_SNORM: 36760,
    R16F: 33325,
    R32F: 33326,
    R8I: 33329,
    R8UI: 33330,
    R16I: 33331,
    R16UI: 33332,
    R32I: 33333,
    R32UI: 33334,
    RG8: 33323,
    RG8_SNORM: 36761,
    RG16F: 33327,
    RG32F: 33328,
    RG8I: 33335,
    RG8UI: 33336,
    RG16I: 33337,
    RG16UI: 33338,
    RG32I: 33339,
    RG32UI: 33340,
    RGB8: 32849,
    SRGB8: 35905,
    RGB565: 36194,
    RGB9_E5: 35901,
    RGB16F: 34843,
    RGB32F: 34837,
    RGBM7C0: 34849, // Custom format?
    RGB8I: 36227,
    RGB8UI: 36221,
    RGB16I: 36233,
    RGB16UI: 36224,
    RGB32I: 36225,
    RGB32UI: 36226,
    RGBA8: 32856,
    SRGB8_ALPHA8: 35907,
    RGBA4: 32854,
    RGB5_A1: 32855,
    RGBA16F: 34842,
    RGBA32F: 34836,
    RGBA8I: 36238,
    RGBA8UI: 36220,
    RGBA16I: 36239,
    RGBA16UI: 36222,
    RGBA32I: 36240,
    RGBA32UI: 36223,
    DEPTH_COMPONENT16: 33189,
    DEPTH_COMPONENT24: 33190,
    DEPTH_COMPONENT32F: 36012,
    DEPTH24_STENCIL8: 35056,
    DEPTH32F_STENCIL8: 36013,

    // Compressed Formats
    COMPRESSED_RGB_S3TC_DXT1_EXT: 33776,
    COMPRESSED_RGBA_S3TC_DXT1_EXT: 33777,
    COMPRESSED_RGBA_S3TC_DXT3_EXT: 33778,
    COMPRESSED_RGBA_S3TC_DXT5_EXT: 33779,
    COMPRESSED_SRGB_S3TC_DXT1_EXT: 35916,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT: 35917,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT: 35918,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT: 35919,
    COMPRESSED_RED_RGTC1: 36283,
    COMPRESSED_SIGNED_RED_RGTC1: 36284,
    COMPRESSED_RG_RGTC2: 36285,
    COMPRESSED_SIGNED_RG_RGTC2: 36286,
    COMPRESSED_RGBA_BPTC_UNORM_ARB: 36492,
    COMPRESSED_SRGB_ALPHA_BPTC_UNORM_ARB: 36493,
    COMPRESSED_RGB_BPTC_SIGNED_FLOAT_ARB: 36494,
    COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_ARB: 36495,

    // Texture Anisotropy
    MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047,

    // Sync objects (WebGL2)
    SYNC_GPU_COMMANDS_COMPLETE: 37496,
    WAIT_FAILED: 37488,
    TIMEOUT_EXPIRED: 37489,
    CONDITION_SATISFIED: 37490,
    ALREADY_SIGNALED: 37491,
    SYNC_FLUSH_COMMANDS_BIT: 1,

    // Framebuffer
    COLOR_ATTACHMENT0: 36064,
    DEPTH_ATTACHMENT: 36096,
    STENCIL_ATTACHMENT: 36128,
    DEPTH_STENCIL_ATTACHMENT: 33306,
  };

  // --- Core Constants ---
  const GL_EXTENSIONS = {
    WEBGL_DEPTH_TEXTURE: 33776,
    OES_TEXTURE_FLOAT: 33777,
    OES_TEXTURE_HALF_FLOAT: 33778,
    WEBGL_COLOR_BUFFER_FLOAT: 33779,
  };

  const ColorSpace = {
    UNKNOWN: "",
    SRGB: "srgb",
    SRGB_LINEAR: "srgb-linear",
    LINEAR: "linear",
    DEFAULT_SRGB: "srgb", // Renamed from Yt
  };

  const RendererConstants = {
    // Other common THREE.js renderer constants might be here, e.g., mapping types.
    BASIC_SHADOW_MAP: 0,
    PCF_SHADOW_MAP: 1,
    PCF_SOFT_SHADOW_MAP: 2,
    VSM_SHADOW_MAP: 3,

    ALPHA_FORMAT: 1000,
    RGB_FORMAT: 1001,
    RGBA_FORMAT: 1002,
    LUMINANCE_FORMAT: 1003,
    LUMINANCE_ALPHA_FORMAT: 1004,
    RED_FORMAT: 1005,
    RED_INTEGER_FORMAT: 1006,
    RG_FORMAT: 1007,
    RG_INTEGER_FORMAT: 1008,
    RGB_INTEGER_FORMAT: 1009,
    RGBA_INTEGER_FORMAT: 1010,
    DEPTH_COMPONENT_FORMAT: 1011,
    DEPTH_STENCIL_FORMAT: 1012,
    RGB_ETC1_FORMAT: 1013,
    RGBA_ETC1_FORMAT: 1014,
    RGBA_ASTC_4X4_FORMAT: 1015,
    RGBA_ASTC_5X4_FORMAT: 1016,
    RGBA_ASTC_5X5_FORMAT: 1017,
    RGBA_ASTC_6X5_FORMAT: 1018,
    RGBA_ASTC_6X6_FORMAT: 1019,
    RGBA_ASTC_8X5_FORMAT: 1020,
    RGBA_ASTC_8X6_FORMAT: 1021,
    RGBA_ASTC_8X8_FORMAT: 1022,
    RGBA_ASTC_10X5_FORMAT: 1023,
    RGBA_ASTC_10X6_FORMAT: 1024,
    RGBA_ASTC_10X8_FORMAT: 1025,
    RGBA_ASTC_10X10_FORMAT: 1026,
    RGBA_ASTC_12X10_FORMAT: 1027,
    RGBA_ASTC_12X12_FORMAT: 1028,
    RGB_PVRTC1_4_FORMAT: 1029,
    RGB_PVRTC1_2_FORMAT: 1030,
    RGBA_PVRTC1_4_FORMAT: 1031,
    RGBA_PVRTC1_2_FORMAT: 1032,
    RGB_ETC2_FORMAT: 1033,
    RGBA_ETC2_EAC_FORMAT: 1034,

    UnsignedByteType: 1000, // Renamed from Ql
    HalfFloatType: 1001, // Renamed from Qa
    FloatType: 1002, // Renamed from tc
  };

  const MiscConstants = {
    // Animation/Timing
    EASE_OUT_EXPO_CSS: "300 es", // Renamed from eo
    DEFAULT_MAX_ANISOTROPY: 2e3, // Renamed from Je
    TEXEL_BUFFER_TEXTURE: 2001, // Renamed from ji
  };

  // Hexadecimal string lookup table (for color conversion or similar)
  const HexLookup = [
    "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0a", "0b", "0c", "0d", "0e", "0f",
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f",
    "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f",
    "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "3a", "3b", "3c", "3d", "3e", "3f",
    "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "4a", "4b", "4c", "4d", "4e", "4f",
    "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "5a", "5b", "5c", "5d", "5e", "5f",
    "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6a", "6b", "6c", "6d", "6e", "6f",
    "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "7a", "7b", "7c", "7d", "7e", "7f",
    "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "8a", "8b", "8c", "8d", "8e", "8f",
    "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "9a", "9b", "9c", "9d", "9e", "9f",
    "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af",
    "b0", "b1", "b2", "b3", "b4", "b5", "b6"
  ];


  // --- Global State / Cache ---
  const threeWarningCache = {}; // Renamed from io

  // --- Utility Functions ---

  /**
   * Checks if any element in the array is greater than or equal to 65535.
   * @param {number[]} array
   * @returns {boolean}
   */
  function containsLargeValue(array) {
    for (let i = array.length - 1; i >= 0; --i) {
      if (array[i] >= 65535) return true;
    }
    return false;
  }

  /**
   * Creates an HTML element in the XHTML namespace.
   * @param {string} tagName
   * @returns {HTMLElement}
   */
  function createElementNs(tagName) {
    return document.createElementNS("http://www.w3.org/1999/xhtml", tagName);
  }

  /**
   * Creates a canvas element with display: block style.
   * @returns {HTMLCanvasElement}
   */
  function createCanvasElement() {
    const canvas = createElementNs("canvas");
    canvas.style.display = "block";
    return canvas;
  }

  /**
   * Logs a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function logThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.log(prefix, ...messages);
  }

  /**
   * Warns a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function warnThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.warn(prefix, ...messages);
  }

  /**
   * Errors a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function errorThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.error(prefix, ...messages);
  }

  /**
   * Warns a message with a "THREE." prefix, but only once for a given message.
   * Uses `threeWarningCache` to prevent repetitive warnings.
   * @param {...any} messages
   */
  function warnThreeOnce(...messages) {
    const messageKey = messages.join(" ");
    if (!(messageKey in threeWarningCache)) {
      threeWarningCache[messageKey] = true;
      warnThreeMessage(...messages);
    }
  }

  /**
   * Returns a Promise that resolves when a WebGLSync object is signaled.
   * @param {WebGLRenderingContext} gl - The WebGL rendering context.
   * @param {WebGLSync} syncObject - The sync object to wait for.
   * @param {number} timeoutMs - The maximum time to wait in milliseconds.
   * @returns {Promise<void>}
   */
  function clientWaitSyncPromise(gl, syncObject, timeoutMs) {
    return new Promise(function(resolve, reject) {
      function checkSyncStatus() {
        switch (gl.clientWaitSync(syncObject, gl.SYNC_FLUSH_COMMANDS_BIT, 0)) {
          case gl.WAIT_FAILED:
            reject();
            break;
          case gl.TIMEOUT_EXPIRED:
            setTimeout(checkSyncStatus, timeoutMs);
            break;
          default:
            resolve();
        }
      }
      setTimeout(checkSyncStatus, timeoutMs);
    });
  }

  // --- Classes ---

  /**
   * A basic EventDispatcher implementation.
   */
  class EventDispatcher {
    constructor() {
      this._listeners = undefined;
    }

    /**
     * Adds an event listener.
     * @param {string} type - The type of event.
     * @param {Function} listener - The function to call when the event is dispatched.
     */
    addEventListener(type, listener) {
      if (this._listeners === undefined) {
        this._listeners = {};
      }
      const listeners = this._listeners;
      if (listeners[type] === undefined) {
        listeners[type] = [];
      }
      if (listeners[type].indexOf(listener) === -1) {
        listeners[type].push(listener);
      }
    }

    /**
     * Checks if an event listener is registered for a given type.
     * @param {string} type - The type of event.
     * @param {Function} listener - The listener function.
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
      const listeners = this._listeners;
      return listeners === undefined ? false : listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }

    /**
     * Removes an event listener.
     * @param {string} type - The type of event.
     * @param {Function} listener - The listener function to remove.
     */
    removeEventListener(type, listener) {
      const listeners = this._listeners;
      if (listeners === undefined) {
        return;
      }
      const typeListeners = listeners[type];
      if (typeListeners !== undefined) {
        const index = typeListeners.indexOf(listener);
        if (index !== -1) {
          typeListeners.splice(index, 1);
        }
      }
    }

    /**
     * Dispatches an event.
     * The event object must have a `type` property.
     * Listeners will be called with the event object, and `event.target` will be set to this dispatcher.
     * @param {object} event - The event object to dispatch.
     */
    dispatchEvent(event) {
      const listeners = this._listeners;
      if (listeners === undefined) {
        return;
      }
      const typeListeners = listeners[event.type];
      if (typeListeners !== undefined) {
        event.target = this;
        // Make a copy to prevent issues if listeners are added/removed during dispatch
        const copiedListeners = typeListeners.slice(0);
        for (let i = 0, l = copiedListeners.length; i < l; i++) {
          copiedListeners[i].call(this, event);
        }
        event.target = null; // Clean up
      }
    }
  }

  // Exposed API (example, assuming this is how BlochSphereBundle uses these)
  // This part would typically be defined by the `Bs` parameter or the return value
  // of the IIFE. For this synthesis, we're just making the extracted parts available.
  /*
  return {
    InteractionMode,
    OrbitControlsMode,
    WebGLConstants,
    ColorSpace,
    RendererConstants,
    MiscConstants,
    HexLookup,
    containsLargeValue,
    createElementNs,
    createCanvasElement,
    logThreeMessage,
    warnThreeMessage,
    errorThreeMessage,
    warnThreeOnce,
    clientWaitSyncPromise,
    EventDispatcher,
    // ... potentially other exports
  };
  */

})();

const puppeteer = require('puppeteer');
const {beforeAll, describe, it, expect} = require('vitest');
const {readFileSync} = require('fs');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const temp = require('temp');
const path = require('path');

/**
 * Generates an HTML script with the current repository bundle
 * that we will use to compare.
 */
const bundleString = readFileSync('dist/bloch_sphere.bundle.js', 'utf8');

function htmlContent(clientCode) {
  return `
    <!doctype html>
    <meta charset="UTF-8">
    <html lang="en">
      <head>
      <title>Cirq Web Development page</title>
      </head>
      <body>
      <div id="container"></div>
      <script>${bundleString}</script>
      <script>${clientCode}</script>
      </body>
    </html>
    `;
}

/**
 * Helper to take a screenshot with a given client code.
 */
async function takeScreenshot(clientCode, outputPath) {
  const browser = await puppeteer.launch({args: ['--app']});
  const page = await browser.newPage();
  await page.setContent(htmlContent(clientCode));
  await page.screenshot({path: `${outputPath}.png`});
  await browser.close();
}

/**
 * Helper to compare two images using pixelmatch.
 */
function compareImages(expectedPath, actualPath) {
  const expected = PNG.sync.read(readFileSync(expectedPath));
  const actual = PNG.sync.read(readFileSync(actualPath));
  const {width, height} = expected;
  const diff = new PNG({width, height});

  const pixels = pixelmatch(expected.data, actual.data, diff.data, width, height, {
    threshold: 0.1,
  });

  expect(pixels).toBe(0);
}

// Automatically track and cleanup files on exit
temp.track();

describe('Bloch sphere', () => {
  const dirPath = temp.mkdirSync('tmp');
  const outputPath = path.join(dirPath, 'bloch_sphere');
  const newVectorOutputPath = path.join(dirPath, 'bloch_sphere_vec');

  beforeAll(async () => {
    await takeScreenshot("renderBlochSphere('container')", outputPath);
  });

  it('with no vector matches the gold PNG', () => {
    compareImages('e2e/bloch_sphere/bloch_sphere_expected.png', `${outputPath}.png`);
  });

  beforeAll(async () => {
    await takeScreenshot("renderBlochSphere('container').addVector(0.5, 0.5, 0.5)", newVectorOutputPath);
  });

  it('with custom statevector matches the gold PNG', () => {
    compareImages('e2e/bloch_sphere/bloch_sphere_expected_custom.png', `${newVectorOutputPath}.png`);
  });
});

_forceIdleTriggerAfter(duration) {
        this._state = 'waiting';
        if (this._waitWithRequestAnimationFrame) {
            const startTime = performance.now();
            const animate = () => {
                if (performance.now() - startTime >= duration) {
                    this._triggerIdle();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        } else {
            setTimeout(() => {
                this._triggerIdle();
            }, duration);
        }
    }
}

const COLLECTION_CUTOFF = 1000;
const BAD_TO_STRING_RESULT = new (function(){})().toString();
const RECURSE_LIMIT_DESCRIPTION = "!recursion-limit!";
const DEFAULT_RECURSION_LIMIT = 10;

function try_describe_atomic(value) {
    if (value === null) {
        return "null";
    }
    if (value === undefined) {
        return "undefined";
    }
    if (typeof value === "string") {
        return `"${value}"`;
    }
    if (typeof value === "number") {
        return "" + value;
    }
    if (typeof value === "bigint") {
        return `${value}n`;
    }
    if (typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "symbol") {
        return String(value);
    }
    return undefined;
}

function try_describe_collection(value, recursionLimit) {
    if (recursionLimit === 0) {
        return RECURSE_LIMIT_DESCRIPTION;
    }
    if (value instanceof Map) {
        return describe_Map(value, recursionLimit);
    }
    if (value instanceof Set) {
        return describe_Set(value, recursionLimit);
    }
    if (typeof value === 'object' && value !== null && typeof value[Symbol.iterator] === 'function') {
        return describe_Iterable(value, recursionLimit);
    }
    return undefined;
}

function describe_Object(value, recursionLimit) {
    if (recursionLimit === 0) {
        return RECURSE_LIMIT_DESCRIPTION;
    }
    const properties = [];
    try {
        for (let k in value) {
            if (properties.length > COLLECTION_CUTOFF) {
                properties.push("[...]");
                break;
            }
            // Check if the property is directly on the object (not prototype chain)
            if (Object.prototype.hasOwnProperty.call(value, k)) {
                let keyDesc = describe(k, recursionLimit - 1);
                let valDesc = describe(value[k], recursionLimit - 1);
                properties.push(`${keyDesc}: ${valDesc}`);
            }
        }
    } catch (e) {
        // Fallback if iterating properties fails (e.g., proxy that throws)
        return `Object{<error getting properties: ${e.message}>}`;
    }
    const constructorName = value.constructor ? value.constructor.name : 'Object';
    return `${constructorName}{${properties.join(", ")}}`;
}

function describe_fallback(value, recursionLimit) {
    try {
        let defaultString = String(value);
        if (defaultString !== BAD_TO_STRING_RESULT) {
            return defaultString;
        }
    } catch {
        // ignored
    }
    return describe_Object(value, recursionLimit);
}

/**
 * Attempts to give a useful and unambiguous description of the given value.
 *
 * @param {*} value
 * @param {!number=} recursionLimit
 * @returns {!string}
 */
function describe(value, recursionLimit = DEFAULT_RECURSION_LIMIT) {
    return try_describe_atomic(value) ||
        try_describe_collection(value, recursionLimit) ||
        describe_fallback(value, recursionLimit);
}

/**
 * @param {!Map} map
 * @param {!number} limit
 * @returns {!string}
 */
function describe_Map(map, limit) {
    let entries = [];
    for (let [k, v] of map.entries()) {
        if (entries.length > COLLECTION_CUTOFF) {
            entries.push("[...]");
            break;
        }
        let keyDesc = describe(k, limit - 1);
        let valDesc = describe(v, limit - 1);
        entries.push(`${keyDesc}: ${valDesc}`);
    }
    return `Map{${entries.join(", ")}}`;
}

/**
 * @param {!Set} set
 * @param {!number} limit
 * @returns {!string}
 */
function describe_Set(set, limit) {
    let entries = [];
    for (let e of set) {
        if (entries.length > COLLECTION_CUTOFF) {
            entries.push("[...]");
            break;
        }
        entries.push(describe(e, limit - 1));
    }
    return `Set{${entries.join(", ")}}`;
}

/**
 * @param {!Iterable} seq
 * @param {!number} limit
 * @returns {!string}
 */
function describe_Iterable(seq, limit) {
    let entries = [];
    try {
        for (let e of seq) {
            if (entries.length > COLLECTION_CUTOFF) {
                entries.push("[...]");
                break;
            }
            entries.push(describe(e, limit - 1));
        }
    } catch (e) {
        return `Iterable{<error getting entries: ${e.message}>}`;
    }

    const constructorName = seq.constructor && seq.constructor.name !== 'Object' ? seq.constructor.name : 'Iterable';
    return `${constructorName}{${entries.join(", ")}}`;
}

// Export describe for external use if this is a module.
// This example assumes a global context or explicit export later.
// For CommonJS:
// module.exports = { describe };
// For ES Modules:
// export { describe };

assertThat(describe(s, 10)).isEqualTo(
        "Set{Set{Set{Set{Set{Set{Set{Set{Set{Set{!recursion-limit!}}}}}}}}}}");
});

const r = 3;
const xType = d3.scaleLinear; // type of x-scale
const yType = d3.scaleLinear; // type of y-scale
const marginTop = 20; // top margin, in pixels
const marginRight = 30; // right margin, in pixels
const marginBottom = 30; // bottom margin, in pixels
const marginLeft = 40; // left margin, in pixels
const inset = r * 2; // inset the default range, in pixels
const insetTop = inset; // inset the default y-range
const insetRight = inset; // inset the default x-range
const insetBottom = inset; // inset the default y-range
const insetLeft = inset; // inset the default x-range

const halfHeight = 14;
const halfWidth = 22;

// These variables are assumed to be defined elsewhere in the user's context.
// For the purpose of completing the code, dummy values are used if not provided.
const xDomain = typeof xDomain !== 'undefined' ? xDomain : [0, 10];
const yDomain = typeof yDomain !== 'undefined' ? yDomain : [0, 10];

const n_x = xDomain[1] - xDomain[0];
const n_y = yDomain[1] - yDomain[0];
const width = n_x * (halfWidth * 2.5) + marginLeft + marginRight + insetLeft + insetRight;
const height = n_y * (3 * halfHeight) + marginBottom + insetBottom + marginTop + insetTop;
const xRange = [marginLeft + insetLeft, width - marginRight - insetRight];
const yRange = [height - marginBottom - insetBottom, marginTop + insetTop];

// Construct scales and axes.
const xScale = xType(xDomain, xRange);
const yScale = yType([yDomain[1], yDomain[0]], yRange);
const xAxis = d3.axisBottom(xScale).ticks(width / 80);
const yAxis = d3.axisLeft(yScale).ticks(height / 50);

// Placeholder for d3 if not globally available in this context.
// In a typical browser environment with D3 loaded, this is not needed.
const d3 = typeof d3 !== 'undefined' ? d3 : {
  scaleLinear: (domain, range) => {
    const scale = v => range[0] + (v - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]);
    scale.domain = () => domain;
    scale.range = () => range;
    return scale;
  },
  axisBottom: scale => ({
    ticks: () => ({
      call: () => ({
        select: () => ({
          remove: () => {}
        })
      })
    })
  }),
  axisLeft: scale => ({
    ticks: () => ({
      call: () => ({
        select: () => ({
          remove: () => {}
        })
      })
    })
  }),
  select: selector => {
    if (typeof document === 'undefined') return { append: () => ({ attr: () => ({ attr: () => ({ attr: () => ({}) }) }) }) }; // Dummy for server-side
    return d3.select(selector);
  }
};


function makeCanvas(sel) {
  const svg = sel.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(xAxis)
    .call(g => g.select(".domain").remove())

  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove())

  const datag = svg.append("g")
    .attr("id", "datag");

  return [svg, datag];
}

// Assuming `d3.select("#content")` will work in the environment.
// If run in a non-browser environment, this might need a mock or different initialization.
const [canvas, DATA_G] = makeCanvas(d3.select("#content"));

function drawVlines(vlines, tt) {
  DATA_G.selectAll('line.v')
    .data(vlines, d => d.x)
    .join(
      enter => enter.append("line")
        .attr("class", "v")
        .attr("stroke", "black")
        .attr('x1', d => xScale(d.x))
        .attr('x2', d => xScale(d.x))
        .attr('y1', d => yScale(d.bottom_y))
        .attr('y2', d => yScale(d.bottom_y))
        .call(enter => enter.transition(tt)
          .attr('y2', d => yScale(d.top_y))
        )
        .lower(),
      update => update
        .call(update => update.transition(tt)
          .attr('x1', d => xScale(d.x))
          .attr('x2', d => xScale(d.x))
          .attr('y1', d => yScale(d.bottom_y))
          .attr('y2', d => yScale(d.top_y))
        )
        .lower(),
      exit => exit
        .call(exit => exit.transition(tt)
          .attr('y2', d => yScale(d.bottom_y))
          .remove()
        ),
    );

}

function drawHlines(hlines, tt) {
  DATA_G.selectAll('line.h')
    .data(hlines, d => `${d.y}-${d.left_x}-${d.right_x}`) // Compound key for unique horizontal lines
    .join(
      enter => enter.append("line")
        .attr("class", "h")
        .attr("stroke", "black")
        .attr('x1', d => xScale(d.left_x))
        .attr('x2', d => xScale(d.left_x)) // Start from left edge for animation
        .attr('y1', d => yScale(d.y))
        .attr('y2', d => yScale(d.y))
        .call(enter => enter.transition(tt)
          .attr('x2', d => xScale(d.right_x)) // Animate to right_x
        )
        .lower(),
      update => update
        .call(update => update.transition(tt)
          .attr('x1', d => xScale(d.left_x))
          .attr('x2', d => xScale(d.right_x))
          .attr('y1', d => yScale(d.y))
          .attr('y2', d => yScale(d.y))
        )
        .lower(),
      exit => exit
        .call(exit => exit.transition(tt)
          .attr('x2', d => xScale(d.left_x)) // Animate back to left_x before removing
          .remove()
        ),
    );
}