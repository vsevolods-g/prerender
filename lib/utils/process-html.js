const cheerio = require('cheerio');

const prepareHtmlForPrerender = (html, origin) => {
    const htmlWithoutScripts = removeScriptsFromHtml(html);
    const htmlReplacedRelativeLinks = replaceRelativeLinksWithAbsolute(htmlWithoutScripts, origin);

    return htmlReplacedRelativeLinks;
}

// Remove all <script> tags and script links from the HTML
const removeScriptsFromHtml = (html) => {
    const $ = cheerio.load(html);
    $('script:not([type="application/ld+json"])').remove();
    $('link[href*="script"], link[as="script"]').remove();

    const sanitizedHtml = $.html();

    return sanitizedHtml;
}

const replaceRelativeLinksWithAbsolute = (html, origin) => {
    // Define a regular expression to match href and src attributes with values starting with "/"
    const regex = /(href|src)="\/(.*?)"/g;

    // Replace href and src attributes with absolute URLs
    const replacedString = html.replace(regex, (match, attribute, group1) => {
        if (attribute === 'href') {
            return `href="${origin}/${group1}"`;
        } else if (attribute === 'src') {
            return `src="${origin}/${group1}"`;
        }
        return match;
    });

    return replacedString;
}

module.exports = {
    prepareHtmlForPrerender
}