const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const { Configuration, OpenAIApi } = require('openai');

// Set up OpenAI API
// const configuration = new Configuration({
//   apiKey: 'YOUR_OPENAI_API_KEY', // Replace with your OpenAI API key
// });
// const openai = new OpenAIApi(configuration);

// Clone the GitHub repository
async function cloneRepo(repoUrl, targetDir) {
  const git = simpleGit();
  console.log(`Cloning repository: ${repoUrl}`);
  await git.clone(repoUrl, targetDir);
  console.log(`Repository cloned to: ${targetDir}`);
}

// Find the 'service' folder
function findServiceFolder(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && entry.name === 'service') {
      return fullPath;
    }
    if (entry.isDirectory()) {
      const found = findServiceFolder(fullPath);
      if (found) return found;
    }
  }
  return null;
}

// Read all files in the 'service' folder
function getFilesInFolder(folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isFile() && entry.name !== 'package-lock.json') {
      files.push(fullPath);
    } else if (entry.isDirectory()) {
      files.push(...getFilesInFolder(fullPath));
    }
  }
  return files;
}

// Read file contents and send to OpenAI
async function analyzeFilesWithOpenAI(files) {
  const fileContents = files.map((filePath) => ({
    path: filePath,
    content: fs.readFileSync(filePath, 'utf-8'),
  }));

  const prompt = `
    Analyze the following files from the 'service' folder.
    Provide insights about endpoints implemented, their functionality, and overall structure.

    ${fileContents.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n')}
  `;
  console.log("-----------------------------------")
  console.log(prompt)
  console.log("-----------------------------------")

//   const response = await openai.createCompletion({
//     model: 'text-davinci-003',
//     prompt: prompt,
//     max_tokens: 1500,
//     temperature: 0.5,
//   });

//   console.log('OpenAI Analysis:\n', response.data.choices[0].text);
}

// Main script execution
(async function main() {
  try {
    const repoUrl = 'https://github.com/webprogramming260/simon-service'; // Replace with the GitHub repository URL
    const targetDir = path.join(__dirname, 'repo');

    // Step 1: Clone repository
    await cloneRepo(repoUrl, targetDir);

    // Step 2: Find 'service' folder
    const serviceFolder = findServiceFolder(targetDir);
    if (!serviceFolder) {
      console.error("No 'service' folder found in the repository.");
      return;
    }

    console.log(`'service' folder found at: ${serviceFolder}`);

    // Step 3: Get all files in 'service' folder
    const files = getFilesInFolder(serviceFolder);
    console.log(`Files found in 'service' folder:`, files);

    // Step 4: Analyze files with OpenAI
    await analyzeFilesWithOpenAI(files);

    // Clean up cloned repository (optional)
    exec(`rm -rf '${targetDir}'`);
  } catch (error) {
    console.error('Error:', error);
  }
})();
