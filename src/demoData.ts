import { FileSystemItem } from './types';

/**
 * Web fallback default files used when not running in Electron desktop mode.
 */
const initialFiles: FileSystemItem[] = [
  {
    name: 'assets',
    path: 'assets',
    isFolder: true,
    children: [
      {
        name: 'css',
        path: 'assets/css',
        isFolder: true,
        children: [
          {
            name: 'style.css',
            path: 'assets/css/style.css',
            isFolder: false,
            content: `/* Bangladesh Code à¦¸à§à¦Ÿà¦¾à¦‡à¦² */
body {
  margin: 0;
  font-family: 'Noto Sans Bengali', 'Segoe UI', sans-serif;
  background-color: #f3f4f6;
  color: #333;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #006A4E;
  color: white;
  padding: 12px 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: bold;
  font-size: 18px;
}

.logo img {
  height: 36px;
  width: auto;
}

.menu {
  display: flex;
  list-style: none;
  gap: 20px;
  margin: 0;
  padding: 0;
}

.menu a {
  color: white;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.menu a:hover {
  opacity: 0.8;
}`,
            modified: false,
          },
        ],
      },
      {
        name: 'js',
        path: 'assets/js',
        isFolder: true,
        children: [
          {
            name: 'script.js',
            path: 'assets/js/script.js',
            isFolder: false,
            content: `// Bangladesh Code à¦¸à§à¦•à§à¦°à¦¿à¦ªà§à¦Ÿ
document.addEventListener('DOMContentLoaded', () => {
  console.log('Bangladesh Code à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦²à§‹à¦¡ à¦¹à§Ÿà§‡à¦›à§‡à¥¤');
});`,
          },
        ],
      },
      {
        name: 'images',
        path: 'assets/images',
        isFolder: true,
        children: [
          {
            name: 'logo.png',
            path: 'assets/images/logo.png',
            isFolder: false,
            content: '[Binary Image Data]',
          },
        ],
      },
    ],
  },
  {
    name: 'index.html',
    path: 'index.html',
    isFolder: false,
    content: `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bangladesh Code</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <header>
    <nav class="navbar">
      <div class="logo">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='46' fill='%23006A4E' stroke='%23d4af37' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='32' fill='%23F42A41'/%3E%3C/svg%3E" alt="à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶ à¦¸à¦°à¦•à¦¾à¦°">
        <span>à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶ à¦¸à¦°à¦•à¦¾à¦°</span>
      </div>
      <ul class="menu">
        <li><a href="https://bangladesh.gov.bd">à¦¹à§‹à¦®</a></li>
        <li><a href="https://data.gov.bd">à¦¸à§‡à¦¬à¦¾ à¦¸à¦®à§‚à¦¹</a></li>
        <li><a href="https://github.com/beingniloy/bdcode">à¦¡à¦•à§à¦®à§‡à¦¨à§à¦Ÿà§‡à¦¶à¦¨</a></li>
        <li><a href="https://github.com/beingniloy/bdcode/issues">à¦¯à§‹à¦—à¦¾à¦¯à§‹à¦—</a></li>
      </ul>
    </nav>
  </header>
  
  <main style="padding: 40px; text-align: center; font-family: sans-serif;">
    <h1 style="color: #006A4E;">Bangladesh Codeà§‡ à¦¸à§à¦¬à¦¾à¦—à¦¤à¦®</h1>
    <p style="color: #666; font-size: 16px; margin-top: 10px;">à¦¸à¦¹à¦œà§‡ à¦“ à¦¨à¦¿à¦°à¦¾à¦ªà¦¦à§‡ à¦•à§‹à¦¡ à¦²à¦¿à¦–à§à¦¨, à¦°à¦¾à¦¨ à¦•à¦°à§à¦¨ à¦à¦¬à¦‚ à¦¡à¦¿à¦ªà§à¦²à¦¯à¦¼ à¦•à¦°à§à¦¨à¥¤</p>
  </main>
</body>
</html>`,
    modified: false,
  },
  {
    name: 'server.php',
    path: 'server.php',
    isFolder: false,
    content: `<?php
// à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶ à¦¸à¦°à¦•à¦¾à¦° à¦¸à¦¾à¦°à§à¦­à¦¾à¦° à¦•à¦¨à¦«à¦¿à¦—à¦¾à¦°à§‡à¦¶à¦¨
header("Content-Type: text/plain");
echo "Bangladesh Code à¦¸à¦šà¦² à¦†à¦›à§‡à¥¤";
?>`,
  },
  {
    name: 'config.json',
    path: 'config.json',
    isFolder: false,
    content: `{
  "projectName": "à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶ à¦•à§‹à¦¡ à¦ªà§à¦°à¦œà§‡à¦•à§à¦Ÿ",
  "version": "1.0.0"
}`,
  },
  {
    name: 'readme.md',
    path: 'readme.md',
    isFolder: false,
    content: `# Bangladesh Code (Bangladesh Code)`,
  },
];

export default initialFiles;
