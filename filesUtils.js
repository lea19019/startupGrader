const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');

function cloneRepo(repoUrl, targetDir) {
    const git = simpleGit();
  
    // Synchronous execution block using child process
    console.log(`Cloning repository: ${repoUrl}`);
    const cloneCommand = `git clone ${repoUrl} ${targetDir}`;
    const result = exec(cloneCommand, { stdio: 'inherit' });
  
    if (result.error) {
      throw new Error(`Error cloning repository: ${result.error.message}`);
    }
    
    console.log(`Repository cloned to: ${targetDir}`);
  }
function findFolder(dirPath, folderName) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && entry.name === folderName) {
      return fullPath;
    }
    if (entry.isDirectory()) {
      const found = findFolder(fullPath, folderName);
      if (found) return found;
    }
  }
  return null;
}

function getFilesInFolder(folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isFile() && entry.name !== 'package-lock.json') { // Maybe modify this to only return JS, TS, JSX, and package.json files
      files.push(fullPath);
    } else if (entry.isDirectory()) {
      files.push(...getFilesInFolder(fullPath));
    }
  }
  return files;
}

function deleteRepo() {
    const targetDir = path.join(__dirname, 'repo');
    exec(`rm -rf '${targetDir}'`);
}

function getFiles() {
    try {
        const repoUrl = 'https://github.com/webprogramming260/simon-service'; // Replace with the GitHub repository URL
        const targetDir = path.join(__dirname, 'repo');
    
        cloneRepo(repoUrl, targetDir);
    
        const serviceFolder = findFolder(targetDir, 'service');
        if (!serviceFolder) {
          console.error("No 'service' folder found in the repository.");
          return;
        }
    
        console.log(`'service' folder found at: ${serviceFolder}`);
    
        // Step 3: Get all files in 'service' folder
        const files = getFilesInFolder(serviceFolder);
        
        
        return files
        
      } catch (error) {
        console.error('Error:', error);
      }
}

(function main() {
  try {
    const files = getFiles()
    console.log(`Files found in 'service' folder:`, files);
    deleteRepo()
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
