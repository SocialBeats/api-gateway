const fs = require('fs');
const path = require('path');

const envType = process.argv[2] || 'local';

const envFiles = {
  local: '.env.example',
  docker: '.env.docker.example',
  compose: '.env.docker-compose.example',
};

const sourceFile = envFiles[envType];
const targetFile = '.env';

if (!sourceFile) {
  console.error(`❌ Invalid environment type: ${envType}`);
  console.log('Valid options: local, docker, compose');
  process.exit(1);
}

const sourcePath = path.join(process.cwd(), sourceFile);
const targetPath = path.join(process.cwd(), targetFile);

if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Source file not found: ${sourceFile}`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Environment configured for ${envType}`);
  console.log(`Copied ${sourceFile} to ${targetFile}`);
} catch (error) {
  console.error(`❌ Error copying file: ${error.message}`);
  process.exit(1);
}
