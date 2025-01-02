const fs = require("fs");
const path = require("path");
const acorn = require("acorn");
const glob = require("glob");
const jsx = require('acorn-jsx');

// Extend acorn with JSX support
const acornParser = acorn.Parser.extend(jsx());


// Utility to find folders dynamically
function findFolder(base, folderName) {
  const files = glob.sync(`${base}/**/${folderName}`, { absolute: true });
  return files.length > 0 ? files[0] : null;
}

// Parse JavaScript code into an AST
function parseCode(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
//   return acornParser.parse(code, { ecmaVersion: 2021, sourceType: "module" });
  return acornParser.parse(code);
}

// Check for React hooks in files
function checkHooks(filePath) {
  const hooks = ["useState", "useEffect", "useContext", "useReducer"];
  try {
      const ast = parseCode(filePath);
      const hookUsage = [];
      walkAST(ast, (node) => {
        if (
          node.type === "CallExpression" &&
          hooks.includes(node.callee.name)
        ) {
          hookUsage.push(node.callee.name);
        }
      });
    
      return hookUsage;
  }
  catch {
    return [];
  }
}

// Check for endpoints in server files
function checkEndpoints(filePath) {
  const methods = ["get", "post", "put", "delete"];
  const ast = parseCode(filePath);
console.log(ast)
  const endpoints = [];
  walkAST(ast, (node) => {
    if (
      node.type === "CallExpression" &&
      node.callee.object?.name === "app" &&
      methods.includes(node.callee.property.name)
    ) {
      const path = node.arguments[0]?.value || "unknown path";
      endpoints.push({ method: node.callee.property.name, path });
    }
  });

  return endpoints;
}

// Simple AST walker
function walkAST(node, callback) {
  callback(node);
  for (const key in node) {
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach((n) => n && typeof n.type === "string" && walkAST(n, callback));
    } else if (child && typeof child.type === "string") {
      walkAST(child, callback);
    }
  }
}

// Main script
(async () => {
  const projectRoot = path.resolve("../simon-service");
  const srcFolder = findFolder(projectRoot, "src");
  const serviceFolder = findFolder(projectRoot, "service");

  if (!srcFolder || !serviceFolder) {
    console.error("Error: Required folders 'src' or 'service' not found.");
    return;
  }

  console.log(`Analyzing React hooks in folder: ${srcFolder}`);
  const srcFiles = glob.sync(`${srcFolder}/**/*.{js,jsx}`);
  for (const file of srcFiles) {
    const hooks = checkHooks(file);
    if (hooks.length > 0) {
      console.log(`- ${file}: Hooks detected -> ${hooks.join(", ")}`);
    }
  }

})();
