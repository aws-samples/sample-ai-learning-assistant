import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


// Function to sanitize and validate paths
const sanitizeAndValidatePath = (basePath, dirPath) => {
  const resolvedPath = path.resolve(basePath, dirPath);
  // Ensure the resolved path starts with the base path (prevents path traversal)
  if (!resolvedPath.startsWith(path.resolve(basePath))) {
    throw new Error('Invalid path detected');
  }

  return resolvedPath;
};

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths (make sure these paths are correct)
const frontendPath = sanitizeAndValidatePath(__dirname, './');
const outputPath = sanitizeAndValidatePath(__dirname, '../frontend.zip');

// Check if source directory exists
if (!fs.existsSync(frontendPath)) {
  console.error(`Source directory not found: ${frontendPath}`);
  process.exit(1); // Exit with error code
}

// Start logging the process
console.log(`Zipping files from ${frontendPath} to ${outputPath}`);

// Create a file to stream archive data to
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } }); // Set compression level

// Listen for 'close' event to know when the archive is finished
output.on('close', function () {
  console.log(`${archive.pointer()} total bytes`);
  console.log('Zipping has been finalized and the output file descriptor has closed.');
});

// Listen for 'end' event to know when all data has been written
output.on('end', function () {
  console.log('Data has been drained.');
});

// Listen for warning events and log them
archive.on('warning', function (err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err); // Log non-critical warnings
  } else {
    throw err; // Throw if it's a critical error
  }
});

// Listen for error events and throw the error
archive.on('error', function (err) {
  console.error('Error during zipping:', err);
  throw err;
});

// Pipe the archive data to the output file
archive.pipe(output);

// Recursive function to walk the directory and filter out node_modules
const addFiles = (dirPath) => {
  const items = fs.readdirSync(dirPath);

  items.forEach((item) => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    // Exclude node_modules and log each file
    if (!fullPath.includes('node_modules')) {
      if (stat.isFile()) {
        archive.file(fullPath, { name: path.relative(frontendPath, fullPath) });
      } else if (stat.isDirectory()) {
        addFiles(fullPath); // Recursively add files from subdirectories
      }
    } else {
      console.log(`Skipping node_modules: ${fullPath}`);
    }
  });
};

// Add files to the archive, starting with the frontend directory
addFiles(frontendPath);

// Finalize the archive (this is crucial to start the zipping process)
archive.finalize().then(() => {
  console.log('Archiving process has started.');
}).catch(err => {
  console.error('Error finalizing archive:', err);
  process.exit(1);
});
