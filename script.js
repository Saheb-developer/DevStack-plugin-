let devToolsPlugin;

function init($page, app) {
  const root = document.createElement("div");
  root.innerHTML = `
    <h2 style="color: white; font-size: 20px;">🚀 Dev+ Tools</h2>
    <p style="color: gray;">Welcome to Phase 1! More power coming soon.</p>
  `;
  $page.append(root);
}

function destroy() {
  // Cleanup if needed
}

devToolsPlugin = {
  init,
  destroy
};

if (window.acode) {
  acode.registerPlugin(devToolsPlugin);
}