const fs = require('fs');
const content = fs.readFileSync('src/views/atletas/index.vue', 'utf8');
const templateStart = content.indexOf('<template>');
const templateEnd = content.indexOf('</template>') + 11;
const template = content.substring(templateStart, templateEnd);

const tags = [];
const regex = /<\/?([a-z0-9\-]+)[^>]*>/gi;
let m;
while ((m = regex.exec(template)) !== null) {
  const tag = m[1].toLowerCase();
  const fullTag = m[0];
  if (fullTag.startsWith('</')) {
    if (tags.length === 0) {
      console.log('Orphan closing tag:', fullTag, 'at index', m.index);
      return;
    }
    const last = tags.pop();
    if (last.tag !== tag) {
      console.log('Mismatch! Expected closing for <' + last.tag + '> (opened at ' + last.index + ') but got ' + fullTag + ' at ' + m.index);
      return;
    }
  } else if (!fullTag.endsWith('/>') && !['input', 'img', 'br', 'hr', 'meta', 'link', 'col'].includes(tag)) {
    tags.push({ tag, index: m.index, full: fullTag });
  }
}
if (tags.length > 0) {
  console.log('Unclosed tags remaining:', tags.map(t => t.full).join(', '));
} else {
  console.log('All tags closed properly!');
}
