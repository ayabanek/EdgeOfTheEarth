const fs = require('fs');
const path = require('path');

const mdFile = path.join(__dirname, '..', 'Edge_of_the_Earth_Campaign_Guide_JP.md');
const htmlFile = path.join(__dirname, 'index.html');

const tokenMap = {
    '\\[frost\\]': '<span class="token frost">❄️</span>',
    '\\[skull\\]': '<span class="token skull">💀</span>',
    '\\[cultist\\]': '<span class="token cultist">👤</span>',
    '\\[tablet\\]': '<span class="token tablet">🪨</span>',
    '\\[elder_thing\\]': '<span class="token elder_thing">🦑</span>',
    '\\[autofail\\]': '<span class="token autofail">🚫</span>',
    '\\[elder_sign\\]': '<span class="token elder_sign">🌟</span>',
    '\\[expedition_team_icon\\]': '<span class="token expedition">🚩</span>',
    '\\[expedition\\]': '<span class="token expedition">🚩</span>',
    '\\[ice_and_death\\]': '<span class="token set-icon">🧊</span>',
    '\\[the_crash\\]': '<span class="token set-icon">💥</span>',
    '\\[creatures_in_the_ice\\]': '<span class="token set-icon">👾</span>',
    '\\[deadly_weather\\]': '<span class="token set-icon">🌩️</span>',
    '\\[hazards_of_the_antarctica\\]': '<span class="token set-icon">⚠️</span>',
    '\\[silence_and_mystery\\]': '<span class="token set-icon">❓</span>',
    '\\[tekeli_li\\]': '<span class="token set-icon">🐧</span>',
    '\\[ancient_evils\\]': '<span class="token set-icon">👁️</span>',
    '\\[lost_in_the_night\\]': '<span class="token set-icon">🌑</span>', // Guessing some icon
    '\\[left_behind\\]': '<span class="token set-icon">👣</span>', // Guessing
    '\\[seeping_nightmares\\]': '<span class="token set-icon">🌫️</span>' // Guessing
};

function parseMarkdown(md) {
    const lines = md.split(/\r?\n/);
    let html = '';
    let toc = [];
    let inList = false;
    let listType = ''; // 'ul' or 'ol'
    let inBlockquote = false;
    let detailsOpen = false;

    function closeList() {
        if (inList) {
            html += `</${listType}>\n`;
            inList = false;
        }
    }

    function closeBlockquote() {
        if (inBlockquote) {
            html += '</blockquote>\n';
            inBlockquote = false;
        }
    }

    lines.forEach(line => {
        let trimmed = line.trim();

        // Handle Headers
        const hMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (hMatch) {
            closeList();
            closeBlockquote();
            const level = hMatch[1].length;
            let text = hMatch[2];
            
            // Clean up text for ID
            const id = text.replace(/<[^>]*>/g, '').trim();
            toc.push({ level, text: id });

            if (level === 1) {
                html += `<h1 id="${id}">${applyTokens(text)}</h1>\n`;
            } else if (level === 2) {
                html += `<h2 id="${id}" class="campaign-title">${applyTokens(text)}</h2>\n`;
            } else if (level === 3) {
                if (detailsOpen) {
                    html += `<hr>\n</details>\n`;
                }
                html += `<details id="${id}" class="scenario-section">\n`;
                html += `<summary class="scenario-title"><h3 style="display:inline;">${applyTokens(text)}</h3></summary>\n`;
                detailsOpen = true;
            } else if (level === 4) {
                html += `<h4 id="${id}">${applyTokens(text)}</h4>\n`;
            }
            return;
        }

        // Handle Horizontal Rule
        if (trimmed === '---' || trimmed === '***') {
            closeList();
            closeBlockquote();
            html += '<hr>\n';
            return;
        }

        // Handle Blockquote
        if (trimmed.startsWith('>')) {
            closeList();
            if (!inBlockquote) {
                html += '<blockquote>\n';
                inBlockquote = true;
            }
            let content = trimmed.substring(1).trim();
            html += `<p>${applyTokens(applyFormatting(content))}</p>\n`;
            return;
        } else {
            closeBlockquote();
        }

        // Handle Lists
        const ulMatch = line.match(/^(\s*)\*\s+(.*)$/);
        const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
        if (ulMatch || olMatch) {
            const currentType = ulMatch ? 'ul' : 'ol';
            const content = ulMatch ? ulMatch[2] : olMatch[2];
            if (!inList || listType !== currentType) {
                closeList();
                html += `<${currentType}>\n`;
                inList = true;
                listType = currentType;
            }
            html += `<li>${applyTokens(applyFormatting(content))}</li>\n`;
            return;
        } else {
            closeList();
        }

        // Handle empty line
        if (trimmed === '') {
            return;
        }

        // Handle "anchor-header" style (Bold text at start of line)
        const anchorMatch = trimmed.match(/^\*\*(.*)\*\*$/);
        if (anchorMatch) {
            const text = anchorMatch[1];
            html += `<p id="${text}" class="anchor-header"><strong>${applyTokens(text)}</strong></p>\n`;
            return;
        }

        // Handle regular paragraph
        html += `<p>${applyTokens(applyFormatting(trimmed))}</p>\n`;
    });

    if (detailsOpen) {
        html += `<hr>\n</details>\n`;
    }

    return { html, toc };
}

function applyTokens(text) {
    let result = text;
    for (const [key, val] of Object.entries(tokenMap)) {
        result = result.replace(new RegExp(key, 'g'), val);
    }
    return result;
}

function applyFormatting(text) {
    let result = text;
    // Bold
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Action Links: → [Text](#ID)
    result = result.replace(/→\s*\[(.*?)\]\(#(.*?)\)/g, '→ <a href="#$2" class="action-link">$1</a>');
    // Regular Links: [Text](#ID)
    result = result.replace(/\[(.*?)\]\(#(.*?)\)/g, '<a href="#$2" class="action-link">$1</a>');
    return result;
}

function generateTOC(toc) {
    let html = '<h2>目次</h2><ul>';
    toc.forEach(item => {
        html += `<li class="toc-level-${item.level}"><a href="#${item.text}">${item.text}</a></li>`;
    });
    html += '</ul>';
    return html;
}

async function run() {
    try {
        console.log('Reading Markdown...');
        const md = fs.readFileSync(mdFile, 'utf8');
        const { html, toc } = parseMarkdown(md);
        const tocHtml = generateTOC(toc);

        console.log('Reading HTML Template...');
        let indexHtml = fs.readFileSync(htmlFile, 'utf8');

        // Replace TOC
        console.log('Updating TOC...');
        const tocRegex = /<nav id="toc">.*?<\/nav>/s;
        indexHtml = indexHtml.replace(tocRegex, `<nav id="toc">${tocHtml}</nav>`);

        // Replace Content
        console.log('Updating Content...');
        // We want to replace everything inside <div class="campaign-container"> ... </div>
        // But since there might be nested divs, we use a more careful approach.
        // The container starts at <div class="campaign-container">
        // And ends before <div id="tools-panel"> or right before the closing </main>
        
        const contentStartTag = '<div class="campaign-container">';
        const contentEndTag = '</div>\n        </main>';
        
        const startIndex = indexHtml.indexOf(contentStartTag) + contentStartTag.length;
        const endIndex = indexHtml.indexOf(contentEndTag);
        
        if (startIndex > contentStartTag.length && endIndex > startIndex) {
            indexHtml = indexHtml.substring(0, startIndex) + '\n' + html + indexHtml.substring(endIndex);
        } else {
            console.error('Could not find content tags properly. Falling back to regex.');
            // Fallback
            indexHtml = indexHtml.replace(/(<div class="campaign-container">).*?(<\/main>)/s, `$1\n${html}\n        $2`);
        }

        console.log('Writing updated HTML...');
        fs.writeFileSync(htmlFile, indexHtml, 'utf8');
        console.log('Success!');

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
