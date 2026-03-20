const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.vue') || fullPath.endsWith('.scss')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      if (content.includes('::v-deep')) {
        content = content.replace(/::v-deep\s*\{/g, ':deep() {');
        content = content.replace(/::v-deep\s+([^{,\n]+?)(?=\s*[{,\n])/g, (match, selector) => {
          return `:deep(${selector.trim()})`;
        });
        // Catch any trailing ::v-deep without space and brace
        content = content.replace(/::v-deep/g, ':deep()');
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content);
          console.log(`Updated ${fullPath}`);
        }
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('✅ Replacement complete.');
