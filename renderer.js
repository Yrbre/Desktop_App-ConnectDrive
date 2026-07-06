document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const status = document.getElementById("status");
  const gmailBtn = document.getElementById("gmailBtn");

  status.innerHTML = "Connecting...";

  const result = await window.electronAPI.connectDrive(username, password);

  if (result.success) {
    status.innerHTML = result.message;

    gmailBtn.style.display = "block";
  } else {
    status.innerHTML = result.message;
  }
});

document.getElementById("gmailBtn").addEventListener("click", async () => {
  const result = await window.electronAPI.openIncognito("https://gmail.com");

  if (!result.success) {
    alert(result.message);
  }
});
