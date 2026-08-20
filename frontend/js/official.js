'use strict';

const API = '/api';
let currentOfficial = {
  id: "OFFICER-001",
  username: "officer.tesfaye",
  fullName: "Tesfaye Alemu",
  title: "Screening Officer",
  role: "officer",
  branchName: "Federal Supreme Court — Screening Unit",
  email: "tesfaye.screening@courts.gov.et",
  phone: "+251 11 551 7700 (Ext 14)"
};

let currentOfficialView = 'dashboard';
let currentReviewedTab = 'all';
let allCases = [];
let allNotifications = [];

const ICONS = {
  fileText: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>',
  calendarList: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>',
  userQuestion: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v.01"/><path d="M19 12a2 2 0 0 0 0-4"/></svg>',
  judge: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/></svg>',
  checkCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  searchFile: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>',
  messageHelp: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  fileDemand: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  xCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>',
  calendarClock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><circle cx="16" cy="16" r="4"/><path d="M16 14v2l1 1"/></svg>',
  historyClock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  upload: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  bell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'officer' || u.role === 'screening' || u.role === 'official' || u.role === 'clerk') {
        currentOfficial = Object.assign(currentOfficial, u);
      }
    }
  } catch (e) {}

  updateOfficialHeaderUI();
  startOfficialLiveClock();
  await loadOfficialData();
});

function startOfficialLiveClock() {
  function tick() {
    const now = new Date();
    const clockEl = document.getElementById('official-live-clock');
    if (clockEl) {
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      clockEl.textContent = dayName + ', ' + timeStr;
    }
  }
  tick();
  setInterval(tick, 1000);
}

function updateOfficialHeaderUI() {
  const name = currentOfficial.fullName || "Tesfaye Alemu";
  const initials = name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() || "TA";
  
  const initialsEl = document.getElementById('official-avatar-initials');
  if (initialsEl) initialsEl.textContent = initials;

  const dropInitialsEl = document.getElementById('official-dropdown-avatar');
  if (dropInitialsEl) dropInitialsEl.textContent = initials;

  const dropNameEl = document.getElementById('official-dropdown-fullname');
  if (dropNameEl) dropNameEl.textContent = name;

  const topNameEl = document.getElementById('top-official-name');
  if (topNameEl) topNameEl.textContent = name;
}

function toggleOfficialProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('official-profile-dropdown-menu');
  if (menu) menu.classList.toggle('show');
}

function handleOfficialGlobalClick(e) {
  const menu = document.getElementById('official-profile-dropdown-menu');
  const trigger = document.getElementById('official-profile-pill-trigger');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('show');
    }
  }
}

function openOfficialEditProfileModal() {
  const menu = document.getElementById('official-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');

  document.getElementById('official-modal-title').textContent = 'Edit Officer Profile';
  document.getElementById('official-modal-body').innerHTML = 
    '<form onsubmit="handleOfficialEditProfileSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Name</label>' +
        '<input type="text" id="edit-off-fullname" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentOfficial.fullName || 'Tesfaye Alemu') + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Official Email</label>' +
          '<input type="email" id="edit-off-email" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentOfficial.email || 'tesfaye.screening@courts.gov.et') + '" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Extension / Phone</label>' +
          '<input type="text" id="edit-off-phone" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentOfficial.phone || '+251 11 551 7700 (Ext 14)') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:1rem;border-top:1px solid #f1f5f9;padding-top:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Change Password (leave blank to keep current)</label>' +
        '<input type="password" id="edit-off-password" class="top-search-input" style="border-radius:6px;width:100%" placeholder="••••••••"/>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Save Officer Profile</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeOfficialModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openOfficialModal();
}

function handleOfficialEditProfileSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('edit-off-fullname').value.trim();
  const email = document.getElementById('edit-off-email').value.trim();
  const phone = document.getElementById('edit-off-phone').value.trim();

  currentOfficial.fullName = fullName;
  currentOfficial.email = email;
  currentOfficial.phone = phone;

  sessionStorage.setItem('court_user', JSON.stringify(currentOfficial));
  updateOfficialHeaderUI();
  alert('Officer profile changes saved.');
  closeOfficialModal();
  renderOfficialCurrentView();
}

function logoutOfficial() {
  const menu = document.getElementById('official-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}

async function loadOfficialData() {
  try {
    const [casesRes, notifsRes] = await Promise.all([
      fetch(API + '/cases').catch(() => null),
      fetch(API + '/notifications').catch(() => null)
    ]);
    if (casesRes && casesRes.ok) allCases = await casesRes.json();
    if (notifsRes && notifsRes.ok) allNotifications = await notifsRes.json();
  } catch (err) {}

  renderOfficialCurrentView();
}

function switchOfficialView(viewName) {
  currentOfficialView = viewName;
  document.querySelectorAll('.official-nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.official-nav-btn')).find(b => 
    b.textContent.toLowerCase().includes(viewName.replace('_', ' '))
  );
  if (activeBtn) activeBtn.classList.add('active');

  renderOfficialCurrentView();
}

function renderOfficialCurrentView() {
  const container = document.getElementById('dynamic-official-workspace');
  if (!container) return;

  if (currentOfficialView === 'dashboard') {
    renderOfficialDashboard(container);
  } else if (currentOfficialView === 'filing_queue') {
    renderFilingQueueFullView(container);
  } else if (currentOfficialView === 'cases') {
    renderCasesFullView(container);
  } else if (currentOfficialView === 'judge_assignment') {
    renderJudgeAssignmentView(container);
  } else if (currentOfficialView === 'court_calendar') {
    renderCalendarFullView(container);
  } else if (currentOfficialView === 'document_demands') {
    renderDocumentDemandsView(container);
  } else if (currentOfficialView === 'postponement_requests') {
    renderPostponementRequestsView(container);
  } else if (currentOfficialView === 'notifications') {
    renderOfficialNotificationsView(container);
  } else if (currentOfficialView === 'reports') {
    renderOfficialReportsView(container);
  } else {
    renderOfficialDashboard(container);
  }
}

function renderOfficialDashboard(container) {
  const queueCasesList = allCases.filter(c => c.status === 'pending_screening' || c.screeningStatus === 'pending' || !c.screeningStatus || c.status === 'pending');
  const reviewedCasesList = allCases.filter(c => c.screeningStatus && c.screeningStatus !== 'pending');

  const pendingCount = queueCasesList.length;
  const underScreeningCount = allCases.filter(c => c.status === 'pending_screening').length;
  const approvedCount = allCases.filter(c => c.screeningStatus === 'approved').length;
  const clarificationCount = allCases.filter(c => c.screeningStatus === 'clarification').length;
  const rejectedCount = allCases.filter(c => c.screeningStatus === 'rejected').length;

  const queueRowsHtml = queueCasesList.length ? queueCasesList.slice(0, 6).map(c => {
    const filedDate = c.filingDate ? new Date(c.filingDate).toLocaleString() : 'Recent';
    const docLen = c.documents ? c.documents.length : 1;
    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openFilingReviewModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + (c.petitioner || c.filerName || 'Filer') + '</strong></td>' +
      '<td style="color:#64748b">' + (c.caseType || 'Civil') + '</td>' +
      '<td style="color:#64748b;font-size:0.75rem">' + filedDate + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:0.3rem"><span>' + docLen + ' docs</span></div></td>' +
      '<td><span class="priority-pill prio-medium">MEDIUM</span></td>' +
      '<td><button class="btn-review-sm" onclick="openFilingReviewModal(\'' + c.caseId + '\')">Review</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:1.5rem">No pending filings in screening queue.</td></tr>';

  const reviewedRowsHtml = reviewedCasesList.length ? reviewedCasesList.slice(0, 6).map(r => {
    const revDate = r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : 'Recent';
    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openFilingReviewModal(\'' + r.caseId + '\')">' + r.caseId + '</a></td>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + (r.caseTitle || r.petitioner + ' vs. ' + r.respondent) + '</strong></td>' +
      '<td style="color:#64748b">' + (r.petitioner || 'Filer') + '</td>' +
      '<td style="color:#64748b">' + (r.caseType || 'Civil') + '</td>' +
      '<td style="color:#64748b;font-size:0.75rem">' + revDate + '</td>' +
      '<td style="color:var(--fsc-navy-main);font-weight:600">' + (r.screeningStatus || 'Reviewed') + '</td>' +
      '<td><span class="priority-pill prio-low">' + (r.screeningStatus || 'Done').toUpperCase() + '</span></td>' +
      '<td><button class="btn-review-sm" onclick="openFilingReviewModal(\'' + r.caseId + '\')">View</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:1.5rem">No cases reviewed yet today.</td></tr>';

  container.innerHTML = 
    '<div class="official-greeting-row">' +
      '<h1 class="official-greeting-title">Good morning, ' + (currentOfficial.fullName || 'Tesfaye Alemu') + '</h1>' +
      '<div class="official-greeting-sub">Live screening queue from database.</div>' +
    '</div>' +

    '<div class="official-kpi-grid-5">' +
      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-orange">' + ICONS.inbox + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Pending Filings</div>' +
            '<div class="official-kpi-number">' + pendingCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Queue awaiting review</div>' +
      '</div>' +

      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-blue">' + ICONS.clock + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Under Screening</div>' +
            '<div class="official-kpi-number">' + underScreeningCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Active officer intake</div>' +
      '</div>' +

      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-green">' + ICONS.checkCircle + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Approved</div>' +
            '<div class="official-kpi-number">' + approvedCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Passed screening</div>' +
      '</div>' +

      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-purple">' + ICONS.alertTriangle + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Clarifications</div>' +
            '<div class="official-kpi-number">' + clarificationCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Documents demanded</div>' +
      '</div>' +

      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-red">' + ICONS.xCircle + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Rejected</div>' +
            '<div class="official-kpi-number">' + rejectedCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Defective filings</div>' +
      '</div>' +
    '</div>' +

    '<div class="official-grid-2-col">' +
      '<div class="official-panel-card">' +
        '<div class="official-panel-head-row">' +
          '<div>' +
            '<div class="official-panel-title">Filing Queue</div>' +
            '<div class="official-panel-sub">Real-time filings awaiting screening review.</div>' +
          '</div>' +
        '</div>' +
        '<table class="official-table">' +
          '<thead><tr><th>Case ID</th><th>Filer</th><th>Type</th><th>Filed At</th><th>Docs</th><th>Priority</th><th>Action</th></tr></thead>' +
          '<tbody>' + queueRowsHtml + '</tbody>' +
        '</table>' +
      '</div>' +

      '<div class="official-panel-card">' +
        '<div class="official-panel-head-row">' +
          '<div>' +
            '<div class="official-panel-title">Reviewed Cases</div>' +
            '<div class="official-panel-sub">Screening decisions and assignments.</div>' +
          '</div>' +
        '</div>' +
        '<table class="official-table">' +
          '<thead><tr><th>Case ID</th><th>Title</th><th>Filer</th><th>Type</th><th>Reviewed</th><th>Decision</th><th>Status</th><th>Action</th></tr></thead>' +
          '<tbody>' + reviewedRowsHtml + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

function setReviewedTab(tabName) {
  currentReviewedTab = tabName;
  renderOfficialDashboard(document.getElementById('dynamic-official-workspace'));
}

/* Subviews */
function renderFilingQueueFullView(container) {
  renderOfficialDashboard(container);
}

function renderCasesFullView(container) {
  container.innerHTML = 
    '<div class="official-greeting-row">' +
      '<h1 class="official-greeting-title">Court Docket &amp; Cases Registry</h1>' +
      '<div class="official-greeting-sub">Review active, screening, and assigned federal dockets.</div>' +
    '</div>' +
    '<div class="official-panel-card">' +
      '<table class="official-table">' +
        '<thead><tr><th>Case ID</th><th>Title</th><th>Jurisdiction</th><th>Judge</th><th>Status</th><th>Action</th></tr></thead>' +
        '<tbody>' +
          allCases.slice(0, 15).map(c => 
            '<tr>' +
              '<td><a class="case-link-bold" onclick="openFilingReviewModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
              '<td><strong>' + (c.caseTitle || '') + '</strong></td>' +
              '<td>' + (c.jurisdiction || 'Federal Supreme Court') + '</td>' +
              '<td>' + (c.judgeName || 'Hon. Judge Solomon Desta') + '</td>' +
              '<td><span class="priority-pill prio-low">' + (c.status || 'Active').toUpperCase() + '</span></td>' +
              '<td><button class="btn-review-sm" onclick="openFilingReviewModal(\'' + c.caseId + '\')">View Docket</button></td>' +
            '</tr>'
          ).join('') +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderJudgeAssignmentView(container) {
  container.innerHTML = 
    '<div class="official-greeting-row">' +
      '<h1 class="official-greeting-title">Judicial Assignment Hub</h1>' +
      '<div class="official-greeting-sub">Route approved screening filings to presiding courtroom chambers.</div>' +
    '</div>' +
    '<div class="official-panel-card">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">' +
        '<div style="padding:1.25rem;border:1px solid #cbd5e1;border-radius:8px">' +
          '<h3 style="font-size:1rem;color:var(--fsc-navy-main)">Select Unassigned Filing</h3>' +
          '<select class="top-search-input" style="border-radius:6px;width:100%;margin:0.75rem 0">' +
            '<option>CASE-178721596417 — Awash International Bank vs. Blue Nile Holdings</option>' +
            '<option>CASE-178721612233 — Abebe Kebede vs. Ethio Telecom</option>' +
          '</select>' +
          '<h3 style="font-size:1rem;color:var(--fsc-navy-main);margin-top:0.75rem">Assign Presiding Judge</h3>' +
          '<select class="top-search-input" style="border-radius:6px;width:100%;margin:0.75rem 0">' +
            '<option>Hon. Judge Solomon Desta (Courtroom 4 — Commercial)</option>' +
            '<option>Hon. Judge Bekele Seyoum (Courtroom 2 — Civil)</option>' +
            '<option>Hon. Judge Tewodros Mihret (Courtroom 1 — Cassation)</option>' +
          '</select>' +
          '<button class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Filing assigned to Judge.\'); switchOfficialView(\'dashboard\');">Confirm Judicial Assignment</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderCalendarFullView(container) {
  renderOfficialDashboard(container);
}

function renderDocumentDemandsView(container) {
  container.innerHTML = 
    '<div class="official-greeting-row">' +
      '<h1 class="official-greeting-title">Document Demand Notices</h1>' +
      '<div class="official-greeting-sub">Manage formal electronic evidentiary requests sent to legal counsels.</div>' +
    '</div>' +
    '<div class="official-panel-card">' +
      '<p style="color:#64748b">2 active document demands awaiting response from filers.</p>' +
    '</div>';
}

function renderPostponementRequestsView(container) {
  container.innerHTML = 
    '<div class="official-greeting-row">' +
      '<h1 class="official-greeting-title">Hearing Postponement Requests</h1>' +
      '<div class="official-greeting-sub">5 pending adjournment petitions submitted by advocates.</div>' +
    '</div>' +
    '<div class="official-panel-card">' +
      '<p style="color:#64748b">5 postponement petitions are in order for chamber review.</p>' +
    '</div>';
}

function renderOfficialNotificationsView(container) {
  renderOfficialDashboard(container);
}

function renderOfficialReportsView(container) {
  renderOfficialDashboard(container);
}

/* Modals */
function openFilingReviewModal(caseId) {
  const c = allCases.find(it => it.caseId === caseId) || { caseId: caseId, caseTitle: 'Awash International Bank vs. Blue Nile Holdings', caseType: 'Corporate' };
  document.getElementById('official-modal-title').textContent = 'Screening & Docket Review — ' + c.caseId;
  document.getElementById('official-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<h3 style="font-size:1.05rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">' + (c.caseTitle || c.title || '') + '</h3>' +
      '<div><strong>Case Type:</strong> ' + (c.caseType || 'Corporate') + '</div>' +
      '<div><strong>Filing Documents:</strong> 6 Attached Exhibits (Verified PDF)</div>' +
      '<div style="margin:1rem 0;display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">' +
        '<button class="btn btn-primary" style="padding:0.75rem;background:#16a34a;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Filing Approved and Routed!\'); closeOfficialModal();">Approve &amp; Route</button>' +
        '<button class="btn btn-primary" style="padding:0.75rem;background:#ea580c;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="openClarificationModal();">Request Clarification</button>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button class="btn btn-outline" style="flex:1;padding:0.6rem;cursor:pointer;border:1px solid #cbd5e1;border-radius:6px" onclick="closeOfficialModal()">Close</button>' +
      '</div>' +
    '</div>';
  openOfficialModal();
}

function openClarificationModal() {
  document.getElementById('official-modal-title').textContent = 'Request Filer Clarification';
  document.getElementById('official-modal-body').innerHTML = 
    '<form onsubmit="handleClarificationSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Select Case</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="CASE-178721612233" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Clarification Instructions</label>' +
        '<textarea class="top-search-input" style="border-radius:6px;width:100%;height:80px;padding:0.5rem" required placeholder="Specify missing annexes, signatures, or court fee slips..."></textarea>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Send Clarification Demand (SMS &amp; Portal)</button>' +
    '</form>';
  openOfficialModal();
}

function handleClarificationSubmit(e) {
  e.preventDefault();
  alert('Clarification request dispatched to filer via SMS and Portal.');
  closeOfficialModal();
}

function openAssignJudgeModal() {
  switchOfficialView('judge_assignment');
}

function openDocumentDemandModal() {
  document.getElementById('official-modal-title').textContent = 'Issue Evidentiary Document Demand';
  document.getElementById('official-modal-body').innerHTML = 
    '<form onsubmit="handleDemandSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Target Case ID</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="CASE-178721559922" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Evidentiary Items Demanded</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="e.g. Certified bank statement, Title deed certified copy" required/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Issue Demand Order</button>' +
    '</form>';
  openOfficialModal();
}

function handleDemandSubmit(e) {
  e.preventDefault();
  alert('Document demand order issued.');
  closeOfficialModal();
}

function openApproveRouteModal() {
  alert('Selecting oldest pending filing in queue for approval and routing.');
  openFilingReviewModal('CASE-178721596417');
}

function openRejectModal() {
  document.getElementById('official-modal-title').textContent = 'Reject Inadmissible Filing';
  document.getElementById('official-modal-body').innerHTML = 
    '<form onsubmit="handleRejectSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case ID</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="CASE-..." required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Legal Ground for Rejection</label>' +
        '<select class="top-search-input" style="border-radius:6px;width:100%">' +
          '<option>Lack of Material / Territorial Jurisdiction</option>' +
          '<option>Statute of Limitations Expired</option>' +
          '<option>Non-payment of Statutory Court Fees</option>' +
          '<option>Improper Standing of Petitioner</option>' +
        '</select>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:#dc2626;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Issue Rejection Notice</button>' +
    '</form>';
  openOfficialModal();
}

function handleRejectSubmit(e) {
  e.preventDefault();
  alert('Rejection notice recorded.');
  closeOfficialModal();
}

function openScheduleHearingModal() {
  document.getElementById('official-modal-title').textContent = 'Courtroom Hearing Scheduler';
  document.getElementById('official-modal-body').innerHTML = 
    '<form onsubmit="handleScheduleSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case ID</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="CASE-178721596417" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Hearing Date</label>' +
          '<input type="date" class="top-search-input" style="border-radius:6px;width:100%" value="2026-05-28" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Time Slot</label>' +
          '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="10:00 AM" required/>' +
        '</div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Set Hearing &amp; Dispatch Notices</button>' +
    '</form>';
  openOfficialModal();
}

function handleScheduleSubmit(e) {
  e.preventDefault();
  alert('Hearing scheduled and automated summons dispatched via SMSEthiopia gateway.');
  closeOfficialModal();
}

function openPostponementModal() {
  switchOfficialView('postponement_requests');
}

function openUploadOrderModal() {
  document.getElementById('official-modal-title').textContent = 'Upload Certified Chamber Order';
  document.getElementById('official-modal-body').innerHTML = 
    '<form onsubmit="handleUploadOrderSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Target Case ID</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="CASE-178721596417" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Order Title</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="Interlocutory Order on Production of Records" required/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Upload &amp; Seal Order</button>' +
    '</form>';
  openOfficialModal();
}

function handleUploadOrderSubmit(e) {
  e.preventDefault();
  alert('Court order uploaded and sealed into the judicial docket.');
  closeOfficialModal();
}

function openOfficialSettingsModal() {
  document.getElementById('official-modal-title').textContent = 'Screening Unit Preferences';
  document.getElementById('official-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Automated SMS Summons Dispatch</label>' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Real-time LEX-RATING Verification Alert</label>' +
      '<button class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Unit preferences saved.\'); closeOfficialModal();">Save Preferences</button>' +
    '</div>';
  openOfficialModal();
}

function openOfficialContactModal() {
  document.getElementById('official-modal-title').textContent = 'Official Internal Directory';
  document.getElementById('official-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div><strong>Screening Unit Chief:</strong> Ext 14</div>' +
      '<div><strong>Courtroom 4 Chamber Clerk:</strong> Ext 41</div>' +
      '<div><strong>Chief Registrar Operations:</strong> Ext 01</div>' +
      '<button class="btn btn-outline" style="width:100%;margin-top:1rem;padding:0.6rem;cursor:pointer" onclick="closeOfficialModal()">Close</button>' +
    '</div>';
  openOfficialModal();
}

function openOfficialModal() {
  const modal = document.getElementById('universal-official-modal');
  if (modal) modal.style.display = 'flex';
}

function closeOfficialModal() {
  const modal = document.getElementById('universal-official-modal');
  if (modal) modal.style.display = 'none';
}
