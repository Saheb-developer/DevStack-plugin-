// Globals
let projectPath = "";
let terminalOutput = "";
const CURRENT_VERSION = "1.0.0";

// Tab switching
function switchTab(tabId) {
  ["terminal", "files", "git", "settings", "update"].forEach(id => {
    document.getElementById(id + "-tab").classList.remove("active");
    document.getElementById(id + "-content").classList.add("hidden");
  });
  document.getElementById(tabId + "-tab").classList.add("active");
  document.getElementById(tabId + "-content").classList.remove("hidden");
}

// Append output to terminal window
function appendToTerminal(text) {
  terminalOutput += text + "\n";
  const term = document.getElementById("terminal-text");
  term.textContent = terminalOutput;
  term.scrollTop = term.scrollHeight;
}

// Detect project folder path
function detectProjectPath() {
  if (window.acode && acode.fs) {
    acode.fs.getCurrentFilePath().then(path => {
      projectPath = path.substring(0, path.lastIndexOf("/") + 1);
      document.getElementById("project-path").textContent = `📂 ${projectPath}`;
      loadProjectFiles();
    }).catch(() => {
      document.getElementById("project-path").textContent = "❌ Could not detect project folder";
    });
  } else {
    document.getElementById("project-path").textContent = "❌ Not running inside Acode";
  }
}

// Load project files into file browser
function loadProjectFiles() {
  if (!projectPath) return;
  acode.fs.list(projectPath).then(files => {
    const list = document.getElementById("file-list");
    list.innerHTML = "";
    files.forEach(file => {
      const li = document.createElement("li");
      li.textContent = file.name;
      li.onclick = () => acode.fs.openFile(projectPath + file.name);
      list.appendChild(li);
    });
  }).catch(err => {
    appendToTerminal("Error loading files: " + err);
  });
}

// Handle Enter key in terminal command input
function handleCommandKey(event) {
  if (event.key === "Enter") {
    const cmd = event.target.value.trim();
    event.target.value = "";
    if (!cmd) return;
    runCommand(cmd);
  }
}

// Run shell command using Acode Terminal API
function runCommand(cmd) {
  appendToTerminal("$ " + cmd);
  if (window.acode && acode.terminal && acode.terminal.runCommand) {
    acode.terminal.runCommand(cmd).then(output => {
      appendToTerminal(output);
    }).catch(err => {
      appendToTerminal("Error: " + err);
    });
  } else {
    appendToTerminal("⚠️ Terminal API not available. Command simulated.");
    setTimeout(() => appendToTerminal(`Simulated output for: ${cmd}`), 500);
  }
}

// Git commands

async function gitCommitPush() {
  const message = document.getElementById("commit-message").value.trim();
  if (!message) {
    alert("Please enter a commit message");
    return;
  }
  appendToTerminal(`Running git add, commit, and push...`);
  try {
    await runCommandPromise("git add .");
    await runCommandPromise(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    const pushResult = await runCommandPromise("git push");
    appendToTerminal(pushResult);
    alert("Git commit and push successful!");
  } catch (e) {
    appendToTerminal("Git error: " + e);
    alert("Git operation failed! See terminal output.");
  }
}

async function gitPull() {
  appendToTerminal("Running git pull...");
  try {
    const pullResult = await runCommandPromise("git pull");
    appendToTerminal(pullResult);
    alert("Git pull completed.");
  } catch (e) {
    appendToTerminal("Git error: " + e);
    alert("Git pull failed! See terminal output.");
  }
}

function gitClonePrompt() {
  const url = prompt("Enter Git repository URL to clone:");
  if (!url) return;
  appendToTerminal(`Cloning repo: ${url}`);
  runCommand(`git clone ${url}`);
}

// Utility to run command and get output as Promise (wrapping runCommand + output)
function runCommandPromise(cmd) {
  return new Promise((resolve, reject) => {
    if (!(window.acode && acode.terminal && acode.terminal.runCommand)) {
      appendToTerminal("⚠️ Terminal API not available. Simulated command.");
      setTimeout(() => resolve(`Simulated output for: ${cmd}`), 500);
      return;
    }
    acode.terminal.runCommand(cmd).then(resolve).catch(reject);
  });
}

// Settings load/save

function loadSettings() {
  const theme = localStorage.getItem("devstack-theme") || "dark";
  document.getElementById("theme-select").value = theme;
  applyTheme(theme);
  const shell = localStorage.getItem("devstack-shell") || "bash";
  document.getElementById("shell-select").value = shell;
  const lang = localStorage.getItem("devstack-lang") || "en";
  document.getElementById("lang-select").value = lang;
}

function saveSettings() {
  const theme = document.getElementById("theme-select").value;
  localStorage.setItem("devstack-theme", theme);
  applyTheme(theme);
  const shell = document.getElementById("shell-select").value;
  localStorage.setItem("devstack-shell", shell);
  const lang = document.getElementById("lang-select").value;
  localStorage.setItem("devstack-lang", lang);
}

function applyTheme(theme) {
  if (theme === "light") {
    document.body.style.backgroundColor = "#eee";
    document.body.style.color = "#111";
  } else {
    document.body.style.backgroundColor = "#121212";
    document.body.style.color = "#e0e0e0";
  }
}

// Updater logic

async function checkForUpdate() {
  const statusEl = document.getElementById("update-status");
  statusEl.textContent = "Checking for updates...";
  try {
    // Replace this URL with your own hosted JSON file with version info
    const res = await fetch("https://yourserver.com/devstack/latest.json");
    if (!res.ok) throw new Error("Network response not ok");
    const data = await res.json();
    if (data.version && data.version !== CURRENT_VERSION) {
      statusEl.textContent = `New version ${data.version} available.`;
      if (confirm(`Update to version ${data.version}?`)) {
        window.open(data.downloadUrl, "_blank");
      }
    } else {
      statusEl.textContent = "You have the latest version.";
    }
  } catch (e) {
    statusEl.textContent = "Update check failed: " + e.message;
  }
}

// Init on load
window.onload = () => {
  detectProjectPath();
  loadSettings();
  appendToTerminal("🛠️ Dev Stack plugin loaded. Version " + CURRENT_VERSION);
};
