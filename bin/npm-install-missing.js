#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');
const { argv } = require('process');

// Read the script file

const scriptFilePath = argv[2];
if (!scriptFilePath) {
  console.error('Please provide a script file path.');
  return;
}


fs.readFile(scriptFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading script file:', err);
    return;
  }

  // Find all required packages using regex
  const requiredPackages = data.match(/require\s*\(['"]([^'"]+)['"]\)/g);
  if (!requiredPackages) {
    console.log('No required packages found in the script.');
    return;
  }

  // Extract package names from require statements
  const packageNames = requiredPackages.map(pkg => pkg.match(/require\s*\(['"]([^'"]+)['"]\)/)[1]);

  // Check if packages are already in package.json
  // Assume same dir as script file
  const packageJsonPath = `.${scriptFilePath.split('/').slice(0, -1).join('/')}/package.json`;
  fs.readFile(packageJsonPath, 'utf8', (err, packageJsonData) => {
    if (err) {
      console.error('Error reading package.json:', err);
      return;
    }

    const packageJson = JSON.parse(packageJsonData);
    const missingPackages = packageNames.filter(pkg => !packageJson.dependencies[pkg]);

    if (missingPackages.length === 0) {
      console.log('All required packages are already in package.json.');
      return;
    }

    // Install missing packages using npm
    const npmInstallCommand = `npm install ${missingPackages.join(' ')}`;
    exec(npmInstallCommand, (err, stdout, stderr) => {
      if (err) {
        console.error('Error installing packages:', err);
        return;
      }

      // Update package.json with newly installed packages
      missingPackages.forEach(pkg => {
        packageJson.dependencies[pkg] = '*';
      });

      fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', err => {
        if (err) {
          console.error('Error updating package.json:', err);
          return;
        }

        console.log('Missing packages installed and added to package.json.');
      });
    });
  });
});
