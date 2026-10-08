const fs = require('fs');
const path = require('path');

const sourceDirectory = path.resolve(__dirname, '../node_modules/pdfjs-dist/legacy/build');
const targetDirectory = path.resolve(__dirname, '../assets/pdfjs');

fs.mkdirSync(targetDirectory, { recursive: true });
fs.copyFileSync(path.join(sourceDirectory, 'pdf.min.js'), path.join(targetDirectory, 'pdfjs-core.pdf'));
fs.copyFileSync(path.join(sourceDirectory, 'pdf.worker.min.js'), path.join(targetDirectory, 'pdfjs-worker.pdf'));
console.log('Prepared bundled PDF.js runtime assets.');
