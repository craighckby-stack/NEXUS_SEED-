// Improved version of rasterizeIconPng function
/**
 * Rasterize an icon to PNG.
 * 
 * @param {React.Component} IconComponent - The icon component to rasterize.
 * @param {string} color - The color of the icon in hex format (without # prefix).
 * @param {string} size - The size of the icon (default: "256").
 * @param {string} filename - The filename to save the rasterized icon.
 * @returns {Promise<string>} The filename of the rasterized icon.
 */
async function rasterizeIconPng(IconComponent, color, size = "256", filename) {
    const React = require('react');
    const ReactDOMServer = require('react-dom/server');
    const sharp = require('sharp');
    const iconSvg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(IconComponent, { color: `#${color}`, size: size })
    );

    // Convert SVG to PNG using Sharp
    await sharp(Buffer.from(iconSvg))
        .png()
        .toFile(filename);

    return filename;
}

// Improved version of createGradientBackground function
/**
 * Create a gradient background image.
 * 
 * @param {string} filename - The filename to save the gradient background image.
 * @returns {Promise<string>} The filename of the gradient background image.
 */
async function createGradientBackground(filename) {
    const sharp = require('sharp');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="562.5">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#COLOR1"/>
                <stop offset="100%" style="stop-color:#COLOR2"/>
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;

    await sharp(Buffer.from(svg))
        .png()
        .toFile(filename);

    return filename;
}

// Improved version of html2pptx function
/**
 * Convert HTML to PPTX.
 * 
 * @param {string} htmlFile - The path to the HTML file.
 * @param {pptxgen} pres - The PptxGenJS presentation instance.
 * @param {object} options - The options for the conversion.
 * @returns {Promise<object>} The result of the conversion.
 */
async function html2pptx(htmlFile, pres, options = {}) {
    const pptxgen = require('pptxgenjs');
    const { slide, placeholders } = await convertHtmlToPptx(htmlFile, pres, options);

    return { slide, placeholders };
}

// Improved version of addChart function
/**
 * Add a chart to a slide.
 * 
 * @param {pptxgenSlide} slide - The slide to add the chart to.
 * @param {pptxgenChart} chart - The chart to add.
 * @param {object} data - The data for the chart.
 * @param {object} options - The options for the chart.
 */
function addChart(slide, chart, data, options) {
    slide.addChart(chart, data, options);
}

// Improved version of addTable function
/**
 * Add a table to a slide.
 * 
 * @param {pptxgenSlide} slide - The slide to add the table to.
 * @param {array} tableData - The data for the table.
 * @param {object} options - The options for the table.
 */
function addTable(slide, tableData, options) {
    slide.addTable(tableData, options);
}