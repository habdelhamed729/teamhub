const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const isWindows = os.platform() === "win32";
const venvPath = path.join(__dirname, ".venv");
const binDir = isWindows ? "Scripts" : "bin";
const pythonExecutable = isWindows ? "python.exe" : "python";
const pythonPath = path.join(venvPath, binDir, pythonExecutable);

console.log(`Starting AI FastAPI server using: ${pythonPath}`);

// Emulate virtual environment activation for the spawned process
const env = { ...process.env };
env.VIRTUAL_ENV = venvPath;

// Prepend virtual environment Scripts/bin folder to PATH
const pathDelimiter = isWindows ? ";" : ":";
const binPath = path.join(venvPath, binDir);
env.PATH = binPath + pathDelimiter + (env.PATH || "");

// Remove PYTHONPATH and PYTHONHOME to prevent loading global packages
// and ensure the venv is properly isolated
delete env.PYTHONPATH;
delete env.PYTHONHOME;

// Pre-flight check: verify critical imports work before starting uvicorn
const { execFileSync } = require("child_process");
try {
  execFileSync(pythonPath, ["-c", "from sentence_transformers import SentenceTransformer; print('Pre-flight OK')"], {
    cwd: __dirname,
    env: env,
    stdio: "inherit",
    timeout: 30000,
  });
} catch (err) {
  console.error("\n[AI Server] Pre-flight import check failed. Try reinstalling dependencies:");
  console.error("  cd apps/ai && .venv\\Scripts\\pip install -e .\n");
  process.exit(1);
}

const server = spawn(pythonPath, ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"], {
  stdio: "inherit",
  cwd: __dirname,
  env: env,
});

server.on("error", (err) => {
  console.error("Failed to start uvicorn:", err);
  process.exit(1);
});

server.on("exit", (code) => {
  process.exit(code || 0);
});
