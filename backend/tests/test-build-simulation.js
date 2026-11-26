const fs = require('fs');
const path = require('path');

const base_path = '/EduPeque/';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  let res = arrayOfFiles || [];
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      res = getAllFiles(fullPath, res);
    } else {
      res.push(fullPath);
    }
  });
  return res;
}

if (fs.existsSync('_test_public')) {
  fs.rmSync('_test_public', { recursive: true, force: true });
}
fs.cpSync('frontend', '_test_public', { recursive: true });

const files = getAllFiles('_test_public');
const htmlAttrPattern = /(href|src|action)=(["'])\/(assets|pages|index\.html)([/?#"'])/g;

let modifiedCount = 0;
files.forEach((file) => {
  if (file.endsWith('.html')) {
    const content = fs.readFileSync(file, 'utf8');
    const updated = content.replace(htmlAttrPattern, (match, attr, quote, segment, rest) => {
      return `${attr}=${quote}${base_path}${segment}${rest}`;
    });
    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf8');
      modifiedCount += 1;
    }
  }
});

console.log('Modified HTML files:', modifiedCount);
const sampleHtml = fs.readFileSync('_test_public/index.html', 'utf8');
console.log('Has /EduPeque/assets:', sampleHtml.includes('href="/EduPeque/assets/css/base.css"'));
console.log('Has /EduPeque/pages:', sampleHtml.includes('href="/EduPeque/pages/familia/vinculacion.html"'));

const sampleJs = fs.readFileSync('_test_public/assets/js/login.js', 'utf8');
console.log('JS uncorrupted:', sampleJs.includes("const BASE_PATH = '/EduPeque'") === false && sampleJs.includes("import { resolvePath } from './config.js'"));

fs.rmSync('_test_public', { recursive: true, force: true });
console.log('SUCCESS');
