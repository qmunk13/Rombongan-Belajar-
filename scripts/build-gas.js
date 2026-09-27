import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildGas() {
  const distDir = path.join(__dirname, '../dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  const outPath = path.join(distDir, 'gas-index.html');
  const partsDir = path.join(distDir, 'gas-parts');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error('Error: dist/index.html does not exist. Run npm run build first.');
    process.exit(1);
  }

  if (!fs.existsSync(partsDir)) {
    fs.mkdirSync(partsDir, { recursive: true });
  }

  let rawHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  let cssCombined = '';
  let jsCombined = '';

  // Extract CSS assets
  const styleRegex = /<link\s+[^>]*href="\/assets\/([^"]+)"[^>]*>/g;
  rawHtml = rawHtml.replace(styleRegex, (match, fileName) => {
    const filePath = path.join(distDir, 'assets', fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Extracting CSS asset: ${fileName}`);
      cssCombined += fs.readFileSync(filePath, 'utf8') + '\n';
      return '<!-- CSS_INJECT_POINT -->';
    }
    return match;
  });

  // Extract JS assets
  const scriptRegex = /<script\s+[^>]*src="\/assets\/([^"]+)"[^>]*><\/script>/g;
  rawHtml = rawHtml.replace(scriptRegex, (match, fileName) => {
    const filePath = path.join(distDir, 'assets', fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Extracting JS asset: ${fileName}`);
      let jsContent = fs.readFileSync(filePath, 'utf8');
      jsContent = jsContent
        .replace(/<\/script>/g, '<\\/script>')
        .replace(/<\?/g, '\\x3c?');
      jsCombined += jsContent + '\n';
      return '<!-- JS_INJECT_POINT -->';
    }
    return match;
  });

  // 1. Build Monolithic single gas-index.html
  let fullMonolithHtml = rawHtml
    .replace('<!-- CSS_INJECT_POINT -->', `<style type="text/css">\n${cssCombined}\n</style>`)
    .replace('<!-- JS_INJECT_POINT -->', `<script type="text/javascript">\n${jsCombined}\n</script>`);

  fs.writeFileSync(outPath, fullMonolithHtml, 'utf8');
  console.log(`Successfully generated monolithic Google Apps Script Index.html at: ${outPath}`);

  // 2. Build Split Parts (Index.html, CSS.html, JS_Part1.html, JS_Part2.html, etc.)
  // Split JS into chunks of approx 250,000 characters (~250KB each)
  const chunkSize = 250000;
  const jsChunks = [];
  for (let i = 0; i < jsCombined.length; i += chunkSize) {
    jsChunks.push(jsCombined.substring(i, i + chunkSize));
  }
  if (jsChunks.length === 0) {
    jsChunks.push('');
  }

  // Create CSS.html
  const cssHtmlContent = `<style type="text/css">\n${cssCombined}\n</style>`;
  fs.writeFileSync(path.join(partsDir, 'CSS.html'), cssHtmlContent, 'utf8');

  // Create JS_Part1.html, JS_Part2.html ...
  const jsIncludeTags = [];
  const jsPartNames = [];

  jsChunks.forEach((chunk, index) => {
    const partNum = index + 1;
    const partFileName = `JS_Part${partNum}.html`;
    const partContent = `<script type="text/javascript">\n${chunk}\n</script>`;
    fs.writeFileSync(path.join(partsDir, partFileName), partContent, 'utf8');
    jsIncludeTags.push(`<?!= include('JS_Part${partNum}'); ?>`);
    jsPartNames.push(partFileName);
  });

  // Create Master Index.html template using GAS scriptlets <?!= include(...) ?>
  let masterIndexHtml = rawHtml
    .replace('<!-- CSS_INJECT_POINT -->', `<?!= include('CSS'); ?>`)
    .replace('<!-- JS_INJECT_POINT -->', jsIncludeTags.join('\n'));

  fs.writeFileSync(path.join(partsDir, 'Index.html'), masterIndexHtml, 'utf8');

  // Manifest JSON describing all files and setup
  const manifest = {
    totalParts: 2 + jsChunks.length,
    files: [
      {
        name: 'Index.html',
        type: 'GAS_TEMPLATE',
        description: 'File Utama / Layout Induk (Wajib dibuat pertama kali di GAS)',
        size: masterIndexHtml.length
      },
      {
        name: 'CSS.html',
        type: 'CSS_STYLES',
        description: 'File Style & Tema UI/UX Tailwind CSS',
        size: cssHtmlContent.length
      },
      ...jsChunks.map((c, idx) => ({
        name: `JS_Part${idx + 1}.html`,
        type: 'JS_BUNDLE_CHUNK',
        description: `Bundle Script Aplikasi - Bagian ${idx + 1} dari ${jsChunks.length}`,
        size: c.length
      }))
    ]
  };

  fs.writeFileSync(path.join(partsDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Successfully generated ${manifest.totalParts} modular GAS parts in: ${partsDir}`);
}

buildGas();

