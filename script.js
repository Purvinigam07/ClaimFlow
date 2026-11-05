const STORAGE_KEY = "claimflow_demo_claims";

const starterClaims = [
  { id: "CLM-1001", policy: "POL-784512", name: "Rahul Sharma", type: "Vehicle", amount: 45000, status: "Pending", description: "Vehicle repair after a minor accident", date: "2026-10-25", flagged: false },
  { id: "CLM-1002", policy: "POL-993221", name: "Priya Singh", type: "Health", amount: 18000, status: "Approved", description: "Hospital expense reimbursement", date: "2026-10-24", flagged: false },
  { id: "CLM-1003", policy: "POL-661908", name: "Amit Verma", type: "Property", amount: 72000, status: "Under Review", description: "Water damage to household items", date: "2026-10-23", flagged: false },
  { id: "CLM-1004", policy: "POL-784512", name: "Rohit Kumar", type: "Vehicle", amount: 12000, status: "Flagged", description: "Needs policy and duplicate check", date: "2026-10-22", flagged: true },
  { id: "CLM-1005", policy: "POL-445320", name: "Neha Gupta", type: "Travel", amount: 8500, status: "Rejected", description: "Incomplete supporting information", date: "2026-10-21", flagged: false }
];

let claims = loadClaims();

function loadClaims() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterClaims.slice();
  } catch (error) {
    return starterClaims.slice();
  }
}

function saveClaims() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

function formatMoney(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function statusClass(status) {
  return status.replace(/\s+/g, "-");
}

function statusBadge(status) {
  return `<span class="status ${statusClass(status)}">${escapeHTML(status)}</span>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function renderStats() {
  document.getElementById("total-count").textContent = claims.length;
  document.getElementById("pending-count").textContent =
    claims.filter(claim => claim.status === "Pending" || claim.status === "Under Review").length;
  document.getElementById("approved-count").textContent =
    claims.filter(claim => claim.status === "Approved").length;
  document.getElementById("flagged-count").textContent =
    claims.filter(claim => claim.flagged || claim.status === "Flagged").length;
}

function renderRecentClaims() {
  const recent = claims.slice().reverse().slice(0, 5);
  const body = document.getElementById("recent-claims");
  body.innerHTML = recent.map(claim => `
    <tr>
      <td class="claim-id">${escapeHTML(claim.id)}</td>
      <td>${escapeHTML(claim.policy)}</td>
      <td>${escapeHTML(claim.name)}</td>
      <td>${escapeHTML(claim.type)}</td>
      <td>${formatMoney(claim.amount)}</td>
      <td>${statusBadge(claim.status)}</td>
    </tr>`).join("");
  if (!recent.length) body.innerHTML = '<tr><td colspan="6" class="empty-state">No claims have been submitted yet.</td></tr>';
}

function renderAllClaims(filterText = "") {
  const body = document.getElementById("all-claims");
  const search = filterText.trim().toLowerCase();
  const filtered = claims.filter(claim =>
    [claim.id, claim.policy, claim.name, claim.type, claim.status].some(value =>
      String(value).toLowerCase().includes(search)
    )
  );
  body.innerHTML = filtered.map(claim => `
    <tr>
      <td class="claim-id">${escapeHTML(claim.id)}</td>
      <td>${escapeHTML(claim.policy)}</td>
      <td>${escapeHTML(claim.name)}</td>
      <td>${escapeHTML(claim.type)}</td>
      <td>${formatMoney(claim.amount)}</td>
      <td>${statusBadge(claim.status)}</td>
      <td>
        <select class="action-select" data-claim-id="${escapeHTML(claim.id)}" aria-label="Update status for ${escapeHTML(claim.id)}">
          ${["Pending", "Under Review", "Approved", "Rejected", "Flagged"].map(status =>
            `<option ${claim.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
    </tr>`).join("");
  if (!filtered.length) body.innerHTML = '<tr><td colspan="7" class="empty-state">No matching claims found.</td></tr>';
}

function renderAll() {
  renderStats();
  renderRecentClaims();
  renderAllClaims(document.getElementById("claim-search")?.value || "");
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  document.getElementById(`${pageName}-page`).classList.remove("hidden");
  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });
  const titles = { dashboard: "Dashboard", claims: "All Claims", submit: "Submit a Claim" };
  document.getElementById("page-heading").textContent = titles[pageName] || "Dashboard";
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});
document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.go));
});

document.getElementById("claim-search").addEventListener("input", event => {
  renderAllClaims(event.target.value);
});

document.getElementById("all-claims").addEventListener("change", event => {
  const select = event.target.closest("select[data-claim-id]");
  if (!select) return;
  const claim = claims.find(item => item.id === select.dataset.claimId);
  if (!claim) return;
  claim.status = select.value;
  if (claim.status === "Flagged") claim.flagged = true;
  saveClaims();
  renderAll();
});

document.getElementById("claim-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = formData.get("name").trim();
  const policy = formData.get("policy").trim().toUpperCase();
  const type = formData.get("type");
  const amount = Number(formData.get("amount"));
  const description = formData.get("description").trim();
  const message = document.getElementById("form-message");

  if (!name || !policy || !type || !description || amount <= 0) {
    message.textContent = "Please fill in all fields with valid details.";
    message.className = "form-message error";
    return;
  }

  // Basic demonstration rule: the same policy and claim type are flagged for manual checking.
  const possibleDuplicate = claims.some(claim =>
    claim.policy.toLowerCase() === policy.toLowerCase() && claim.type === type
  );

  const nextNumber = claims.reduce((max, claim) => {
    const number = Number(claim.id.replace("CLM-", "")) || 1000;
    return Math.max(max, number);
  }, 1000) + 1;

  const newClaim = {
    id: `CLM-${nextNumber}`,
    policy,
    name,
    type,
    amount,
    description,
    date: new Date().toISOString().slice(0, 10),
    status: possibleDuplicate ? "Flagged" : "Pending",
    flagged: possibleDuplicate
  };

  claims.push(newClaim);
  saveClaims();
  renderAll();
  form.reset();

  if (possibleDuplicate) {
    message.textContent = `Claim ${newClaim.id} was saved, but flagged because this policy already has a ${type} claim. Please review it.`;
    message.className = "form-message error";
  } else {
    message.textContent = `Claim ${newClaim.id} submitted successfully. Its status is Pending.`;
    message.className = "form-message success";
  }
});

renderAll();
