const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

// Extend acorn with JSX support
const acornParser = acorn.Parser.extend(jsx());

// Helper function to read all files in a directory
const readDirectory = (dirPath) => {
  return fs.readdirSync(dirPath).map((file) => path.join(dirPath, file));
};

// Analyze the `src` folder for React components and hooks
const analyzeReactUsage = (srcPath) => {
  const files = readDirectory(srcPath);
  let hasReact = false;
  let hasReactHooks = false;
  let hasReactRouter = false;
  let componentsFound = [];

  files.forEach((file) => {
    const stats = fs.statSync(file);
    if (stats.isDirectory()) {
      // Recursively analyze subdirectories
      componentsFound = componentsFound.concat(analyzeReactUsage(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Read and parse JS files
      const content = fs.readFileSync(file, 'utf-8');
      try {
        // Parse content with acorn and JSX plugin
        const ast = acornParser.parse(content, {
          sourceType: 'module',
        });

        // Check for React usage (Look for imports or JSX elements)
        if (content.includes('React')) {
          hasReact = true;
        }

        // Check for React hooks (useState, useEffect)
        ast.body.forEach((node) => {
          if (node.type === 'ImportDeclaration') {
            if (node.source.value === 'react') {
              node.specifiers.forEach((specifier) => {
                if (specifier.imported && (specifier.imported.name === 'useState' || specifier.imported.name === 'useEffect')) {
                  hasReactHooks = true;
                }
              });
            }
          }
        });

        // Check for React Router usage (e.g., `import { BrowserRouter, Route, Switch } from 'react-router-dom'`)
        if (content.includes('react-router-dom')) {
          hasReactRouter = true;
        }

        // Check for React components (Functional or Class-based)
        ast.body.forEach((node) => {
          if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
            if (node.id && node.id.name && node.id.name[0].toUpperCase() === node.id.name[0]) {
              componentsFound.push(node.id.name);
            }
          }
          if (node.type === 'ClassDeclaration') {
            if (node.superClass && node.superClass.name === 'Component') {
              componentsFound.push(node.id.name);
            }
          }
        });
      } catch (e) {
        console.error(`Error parsing file ${file}: ${e.message}`);
      }
    }
  });

  return {
    hasReact,
    hasReactHooks,
    hasReactRouter,
    componentsFound,
  };
};

// Start by analyzing the `src` folder
const srcPath = '../simon-service'; // Replace with actual path
const analysis = analyzeReactUsage(srcPath);
console.log(analysis);



// // Example Usage
// const rootDir = '../simon-service';
// const results = analyzeApplication(rootDir);
// console.log(JSON.stringify(results, null, 2));
