const fs = require('fs');
const path = require('path');

function buildGas() {
  const distDir = path.join(__dirname, '../dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  const outPath = path.join(distDir, 'gas-index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error('Error: dist/index.html does not exist. Run npm run build first.');
    process.exit(1);
  }

  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Find all script tags with src="/assets/..." and inline them
  const scriptRegex = /<script\s+[^>]*src="\/assets\/([^"]+)"[^>]*><\/script>/g;
  htmlContent = htmlContent.replace(scriptRegex, (match, fileName) => {
    const filePath = path.join(distDir, 'assets', fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Inlining JS asset: ${fileName}`);
      const jsContent = fs.readFileSync(filePath, 'utf8');
      // Escape </script> tags in js code if any
      const safeJsContent = jsContent.replace(/<\/script>/g, '<\\/script>');
      return `<script type="text/javascript">${safeJsContent}</script>`;
    } else {
      console.warn(`Warning: JS asset file not found: ${filePath}`);
      return match;
    }
  });

  // Find all link stylesheet tags with href="/assets/..." and inline them
  const styleRegex = /<link\s+[^>]*href="\/assets\/([^"]+)"[^>]*>/g;
  htmlContent = htmlContent.replace(styleRegex, (match, fileName) => {
    const filePath = path.join(distDir, 'assets', fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Inlining CSS asset: ${fileName}`);
      const cssContent = fs.readFileSync(filePath, 'utf8');
      return `<style type="text/css">${cssContent}</style>`;
    } else {
      console.warn(`Warning: CSS asset file not found: ${filePath}`);
      return match;
    }
  });

  fs.writeFileSync(outPath, htmlContent, 'utf8');
  console.log(`Successfully generated self-contained Google Apps Script Index.html at: ${outPath}`);
}

buildGas();
