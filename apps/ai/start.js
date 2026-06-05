const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const isWindows = os.platform() === "win32";
const uvicornPath = isWindows
  ? path.join(__dirname, ".venv", "Scripts", "uvicorn")
  : path.join(__dirname, ".venv", "bin", "uvicorn");

console.log(`Starting AI FastAPI server using: ${uvicornPath}`);

const server = spawn(uvicornPath, ["app.main:app", "--reload", "--port", "8000"], {
  stdio: "inherit",
  shell: true,
  cwd: __dirname,
});

server.on("error", (err) => {
  console.error("Failed to start uvicorn:", err);
  process.exit(1);
});

server.on("exit", (code) => {
  process.exit(code || 0);
});
