const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const secret = fs.readFileSync('/Users/shamimhossen/.gemini/antigravity/.vercel-bypass', 'utf8').trim();
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
process.env.CHROME_PATH = chromePath;

const baseUrl = 'https://my-store-git-claude-first-change-shamimhossein70-3034s-projects.vercel.app';
const pages = [
  { name: 'Homepage (/)', path: '/' },
  { name: 'Category (/for-him)', path: '/for-him' },
  { name: 'Product (/product/grey-textured-crepe-two-piece)', path: '/product/grey-textured-crepe-two-piece' },
  { name: 'Checkout (/checkout)', path: '/checkout' },
];

const headerJson = JSON.stringify({ 'x-vercel-protection-bypass': secret });

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function runLighthouse(pageUrl, runIndex) {
  const tmpFile = `lh-run-${Date.now()}-${runIndex}.json`;
  const cmd = `npx lighthouse "${pageUrl}" --chrome-flags="--headless --no-sandbox" --form-factor=mobile --screenEmulation.mobile --throttling-method=devtools --output=json --output-path=${tmpFile} --extra-headers='${headerJson}' --only-categories=performance,accessibility,best-practices,seo`;
  execSync(cmd, { stdio: 'ignore' });
  const report = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
  fs.unlinkSync(tmpFile);

  const totalTransferBytes = report.audits['total-byte-weight']?.numericValue || 0;

  return {
    perf: Math.round((report.categories.performance?.score || 0) * 100),
    a11y: Math.round((report.categories.accessibility?.score || 0) * 100),
    bp: Math.round((report.categories['best-practices']?.score || 0) * 100),
    seo: Math.round((report.categories.seo?.score || 0) * 100),
    lcpMs: report.audits['largest-contentful-paint']?.numericValue || 0,
    cls: report.audits['cumulative-layout-shift']?.numericValue || 0,
    tbtMs: report.audits['total-blocking-time']?.numericValue || 0,
    transferKb: Math.round(totalTransferBytes / 1024),
  };
}

async function main() {
  console.log('=== Starting Baseline Lighthouse Runs on Vercel Preview ===');
  console.log('Target URL:', baseUrl);
  const results = {};

  for (const page of pages) {
    const fullUrl = `${baseUrl}${page.path}`;
    console.log(`\nAuditing ${page.name}...`);
    const runs = [];
    for (let i = 1; i <= 3; i++) {
      process.stdout.write(`  Run ${i}/3... `);
      const res = await runLighthouse(fullUrl, i);
      console.log(`Perf: ${res.perf}, LCP: ${(res.lcpMs / 1000).toFixed(2)}s, CLS: ${res.cls.toFixed(4)}, TBT: ${res.tbtMs.toFixed(0)}ms, Size: ${res.transferKb}KB`);
      runs.push(res);
    }

    results[page.name] = {
      perf: median(runs.map(r => r.perf)),
      a11y: median(runs.map(r => r.a11y)),
      bp: median(runs.map(r => r.bp)),
      seo: median(runs.map(r => r.seo)),
      lcpMs: median(runs.map(r => r.lcpMs)),
      cls: median(runs.map(r => r.cls)),
      tbtMs: median(runs.map(r => r.tbtMs)),
      transferKb: median(runs.map(r => r.transferKb)),
      runs,
    };
  }

  // Create docs/perf directory
  const perfDir = path.join(__dirname, '../docs/perf');
  if (!fs.existsSync(perfDir)) {
    fs.mkdirSync(perfDir, { recursive: true });
  }

  let md = `# Lighthouse Baseline Performance (Mobile Preset)\n\n`;
  md += `**Date:** 11 November 2026\n`;
  md += `**Environment:** Vercel Preview (${baseUrl})\n`;
  md += `**Git Commit:** e5dfb5a (Branch: \`claude-first-change\`)\n`;
  md += `**Methodology:** 3 mobile runs per route, DevTools throttling, median selected.\n`;
  md += `**Note on Placeholder Images:** Raw images currently load from \`cdn.gentlepark.com\` without optimization. Agent P1 will route through \`next/image\`.\n\n`;
  md += `## Median Results Summary\n\n`;
  md += `| Route | Performance | LCP (s) | CLS | TBT (ms) | Transfer (KB) | Accessibility | Best Practices | SEO |\n`;
  md += `|---|---|---|---|---|---|---|---|---|\n`;

  for (const [name, data] of Object.entries(results)) {
    md += `| **${name}** | ${data.perf} | ${(data.lcpMs / 1000).toFixed(2)}s | ${data.cls.toFixed(4)} | ${data.tbtMs.toFixed(0)}ms | ${data.transferKb} KB | ${data.a11y} | ${data.bp} | ${data.seo} |\n`;
  }

  md += `\n## Raw Run Details\n\n`;
  for (const [name, data] of Object.entries(results)) {
    md += `### ${name}\n\n`;
    md += `| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |\n`;
    md += `|---|---|---|---|---|---|---|---|---|\n`;
    data.runs.forEach((r, idx) => {
      md += `| Run ${idx + 1} | ${r.perf} | ${(r.lcpMs / 1000).toFixed(2)}s | ${r.cls.toFixed(4)} | ${r.tbtMs.toFixed(0)}ms | ${r.transferKb} KB | ${r.a11y} | ${r.bp} | ${r.seo} |\n`;
    });
    md += `| **Median** | **${data.perf}** | **${(data.lcpMs / 1000).toFixed(2)}s** | **${data.cls.toFixed(4)}** | **${data.tbtMs.toFixed(0)}ms** | **${data.transferKb} KB** | **${data.a11y}** | **${data.bp}** | **${data.seo}** |\n\n`;
  }

  fs.writeFileSync(path.join(perfDir, 'baseline.md'), md);
  console.log('\n✓ Baseline results saved to docs/perf/baseline.md');
}

main().catch(err => {
  console.error('Baseline failed:', err);
  process.exit(1);
});
