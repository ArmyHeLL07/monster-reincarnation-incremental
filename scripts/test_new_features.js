import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runTestsTs = path.join(__dirname, 'run_new_tests.ts');
const runTestsTmpJs = path.join(__dirname, 'run_new_tests.tmp.js');

try {
  console.log("Compiling run_new_tests.ts with esbuild...");
  execSync(`npx esbuild "${runTestsTs}" --bundle --platform=node --outfile="${runTestsTmpJs}"`, { stdio: 'inherit' });
  
  console.log("\nExecuting compiled tests with Node...");
  execSync(`node "${runTestsTmpJs}"`, { stdio: 'inherit' });
} catch (err) {
  console.error("\nTests failed or build failed.");
  process.exit(1);
} finally {
  if (fs.existsSync(runTestsTmpJs)) {
    fs.unlinkSync(runTestsTmpJs);
  }
}
