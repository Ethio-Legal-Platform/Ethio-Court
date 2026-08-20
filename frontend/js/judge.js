'use strict';

const API = '/api';
let currentJudge = {
  id: "JUDGE-001",
  username: "judge.solomon",
  fullName: "Hon. Judge Solomon Desta",
  email: "solomon.desta@fsc.gov.et",
  phone: "+251 11 551 7700 (Ext 404)",
  role: "judge",
  courtroom: "Courtroom 4",
  branch: "Federal Supreme Court"
};

let currentJudgeView = 'overview';
let judgeAssignedCases = [];
let allCourtCases = [];
let activeTabFilter = 'Active (12)';
let searchQuery = '';

const ICONS = {
  folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
  calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  gavel: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>',
  scales: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  docDemand: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>',
  order: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  pencil: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
  checkCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'judge') currentJudge = Object.assign(currentJudge, u);
    }
  } catch (e) {}

  updateJudgeHeaderUI();
  await loadJudgeData();
});

function updateJudgeHeaderUI() {
  const name = currentJudge.fullName || "Hon. Judge Solomon Desta";
  const initials = name.split(' ').filter(p => !p.toLowerCase().includes('hon') && !p.toLowerCase().includes('judge')).map(p => p[0]).join('').substring(0, 2) || "SD";
  
  const headerNameEl = document.getElementById('header-judge-name');
  if (headerNameEl) headerNameEl.textContent = name;
  
  const initialsEl = document.getElementById('judge-avatar-initials');
  if (initialsEl) initialsEl.textContent = initials;

  const dropInitialsEl = document.getElementById('dropdown-avatar-circle');
  if (dropInitialsEl) dropInitialsEl.textContent = initials;

  const dropNameEl = document.getElementById('dropdown-user-fullname');
  if (dropNameEl) dropNameEl.textContent = name;

  const dropSubEl = document.getElementById('dropdown-user-sub');
  if (dropSubEl) dropSubEl.textContent = (currentJudge.branch || "Federal Supreme Court") + " · " + (currentJudge.courtroom || "Courtroom 4");
}

function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('judge-profile-dropdown-menu');
  if (menu) menu.classList.toggle('show');
}

function handleGlobalClick(e) {
  const menu = document.getElementById('judge-profile-dropdown-menu');
  const trigger = document.getElementById('judge-profile-pill-trigger');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('show');
    }
  }
}

function openEditProfileModal() {
  const menu = document.getElementById('judge-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');

  document.getElementById('judge-modal-title').textContent = 'Edit Presiding Judge Profile';
  document.getElementById('judge-modal-body').innerHTML = 
    '<form onsubmit="handleEditProfileSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Judicial Title &amp; Name</label>' +
        '<input type="text" id="edit-judge-fullname" class="judge-search-input" value="' + (currentJudge.fullName || 'Hon. Judge Solomon Desta') + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Official FSC Email</label>' +
          '<input type="email" id="edit-judge-email" class="judge-search-input" value="' + (currentJudge.email || 'solomon.desta@fsc.gov.et') + '" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Chamber Extension / Phone</label>' +
          '<input type="text" id="edit-judge-phone" class="judge-search-input" value="' + (currentJudge.phone || '+251 11 551 7700 (Ext 404)') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Division / Bench</label>' +
          '<input type="text" id="edit-judge-branch" class="judge-search-input" value="' + (currentJudge.branch || 'Federal Supreme Court') + '" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Assigned Courtroom</label>' +
          '<input type="text" id="edit-judge-courtroom" class="judge-search-input" value="' + (currentJudge.courtroom || 'Courtroom 4') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:1rem;border-top:1px solid #f1f5f9;padding-top:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Update Password (leave blank to keep current)</label>' +
        '<input type="password" id="edit-judge-password" class="judge-search-input" placeholder="••••••••"/>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Save Profile Changes</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeJudgeModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openJudgeModal();
}

function handleEditProfileSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('edit-judge-fullname').value.trim();
  const email = document.getElementById('edit-judge-email').value.trim();
  const phone = document.getElementById('edit-judge-phone').value.trim();
  const branch = document.getElementById('edit-judge-branch').value.trim();
  const courtroom = document.getElementById('edit-judge-courtroom').value.trim();

  currentJudge.fullName = fullName;
  currentJudge.email = email;
  currentJudge.phone = phone;
  currentJudge.branch = branch;
  currentJudge.courtroom = courtroom;

  sessionStorage.setItem('court_user', JSON.stringify(currentJudge));
  updateJudgeHeaderUI();
  alert('Profile updated successfully.');
  closeJudgeModal();
  renderJudgeCurrentView();
}

function logoutJudge() {
  const menu = document.getElementById('judge-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}

async function loadJudgeData() {
  try {
    const res = await fetch(API + '/cases').catch(() => null);
    if (res && res.ok) {
      allCourtCases = await res.json();
    }
  } catch (err) {}
  
  renderJudgeCurrentView();
}

function switchJudgeView(viewName) {
  currentJudgeView = viewName;
  document.querySelectorAll('.judge-nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.judge-nav-btn')).find(b => 
    b.textContent.toLowerCase().includes(viewName.replace('_', ' '))
  );
  if (activeBtn) activeBtn.classList.add('active');

  renderJudgeCurrentView();
}

function setJudgeTabFilter(tabName) {
  activeTabFilter = tabName;
  renderJudgeCurrentView();
}

function handleJudgeSearch(q) {
  searchQuery = (q || '').toLowerCase().trim();
  renderJudgeCurrentView();
}

function renderJudgeCurrentView() {
  const container = document.getElementById('dynamic-judge-workspace');
  if (!container) return;

  if (currentJudgeView === 'overview') {
    renderJudgeOverview(container);
  } else if (currentJudgeView === 'assigned_cases') {
    renderAssignedCasesView(container);
  } else if (currentJudgeView === 'todays_hearings') {
    renderTodaysHearingsView(container);
  } else if (currentJudgeView === 'court_calendar') {
    renderCourtCalendarView(container);
  } else if (currentJudgeView === 'evidence_documents') {
    renderEvidenceDocumentsView(container);
  } else if (currentJudgeView === 'motions_requests') {
    renderMotionsRequestsView(container);
  } else if (currentJudgeView === 'appeals') {
    renderAppealsView(container);
  } else if (currentJudgeView === 'ratings') {
    renderJudgeRatingsView(container);
  } else if (currentJudgeView === 'reports') {
    renderJudgeReportsView(container);
  } else {
    renderJudgeOverview(container);
  }
}

function renderJudgeOverview(container) {
  const todaysHearingsList = [
    { time: '09:00 AM', caseId: 'CASE-178721596417', title: 'Awash International Bank vs. Blue Nile Holdings', type: 'Preliminary Hearing', parties: 'Plaintiff vs. Defendant', courtroom: 'Courtroom 4', status: 'UPCOMING', statusClass: 'pill-blue' },
    { time: '11:00 AM', caseId: 'CASE-178719224815', title: 'Mulualem Desta vs. Ethio Telecom', type: 'Oral Arguments', parties: 'Plaintiff vs. Defendant', courtroom: 'Courtroom 4', status: 'UPCOMING', statusClass: 'pill-blue' },
    { time: '02:00 PM', caseId: 'CASE-178715887332', title: 'Aster Manufacturing vs. Ministry of Revenues', type: 'Hearing', parties: 'Plaintiff vs. Defendant', courtroom: 'Courtroom 4', status: 'UPCOMING', statusClass: 'pill-blue' },
    { time: '04:00 PM', caseId: 'CASE-178712005521', title: 'Yalemwork Alemu vs. Hibret Insurance', type: 'Judgment', parties: 'Plaintiff vs. Defendant', courtroom: 'Courtroom 4', status: 'JUDGMENT DUE', statusClass: 'pill-orange' }
  ];

  const assignedCasesList = [
    { caseId: 'CASE-178721596417', title: 'Awash International Bank vs. Blue Nile Holdings', filedOn: 'May 17, 2026', nextHearing: 'May 27, 2026 09:30 AM', stage: 'Evidence Stage', stepIndex: 1, status: 'ACTIVE', statusClass: 'pill-green' },
    { caseId: 'CASE-178719224815', title: 'Mulualem Desta vs. Ethio Telecom', filedOn: 'May 10, 2026', nextHearing: 'Jun 02, 2026 10:00 AM', stage: 'Assigned', stepIndex: 1, status: 'ACTIVE', statusClass: 'pill-green' },
    { caseId: 'CASE-178715887332', title: 'Aster Manufacturing vs. Ministry of Revenues', filedOn: 'May 01, 2026', nextHearing: 'Jun 10, 2026 11:30 AM', stage: 'Hearing Stage', stepIndex: 2, status: 'ACTIVE', statusClass: 'pill-green' }
  ];

  let filteredAssigned = assignedCasesList;
  if (searchQuery) {
    filteredAssigned = allCourtCases.length ? allCourtCases.filter(c => 
      (c.caseId && c.caseId.toLowerCase().includes(searchQuery)) ||
      (c.caseTitle && c.caseTitle.toLowerCase().includes(searchQuery))
    ).map(c => ({
      caseId: c.caseId,
      title: c.caseTitle,
      filedOn: new Date(c.createdAt || Date.now()).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'}),
      nextHearing: c.hearingTime ? 'May 27, 2026 ' + c.hearingTime : 'Jun 05, 2026 10:00 AM',
      stage: c.status === 'closed' ? 'Decided' : (c.status === 'screening' ? 'Assigned' : 'Hearing Stage'),
      stepIndex: c.status === 'closed' ? 4 : 2,
      status: (c.status === 'closed' ? 'DECIDED' : 'ACTIVE'),
      statusClass: (c.status === 'closed' ? 'pill-blue' : 'pill-green')
    })) : assignedCasesList;
  }

  const hearingsRowsHtml = todaysHearingsList.map(h => 
    '<tr>' +
      '<td style="font-weight:700;color:#0f172a;white-space:nowrap">' + h.time + '</td>' +
      '<td>' +
        '<a class="case-link-bold" onclick="openJudgeCaseModal(\'' + h.caseId + '\')">' + h.caseId + '</a><br>' +
        '<span style="font-size:0.75rem;color:#475569">' + h.title + '</span>' +
      '</td>' +
      '<td style="color:#475569;font-weight:500">' + h.type + '</td>' +
      '<td style="color:#64748b;font-size:0.75rem">' + h.parties + '</td>' +
      '<td style="color:#475569">' + h.courtroom + '</td>' +
      '<td><span class="judge-pill " + h.statusClass + "">' + h.status + '</span></td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:0.4rem">' +
          '<button class="btn-open-case" onclick="openJudgeCaseModal(\'' + h.caseId + '\')">Open Case</button>' +
          '<button class="btn-open-case" style="padding:0.35rem 0.45rem" onclick="openHearingActionMenu(\'' + h.caseId + '\')">⋮</button>' +
        '</div>' +
      '</td>' +
    '</tr>'
  ).join('');

  const assignedRowsHtml = filteredAssigned.map(c => 
    '<tr>' +
      '<td><a class="case-link-bold" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td><strong>' + c.title + '</strong></td>' +
      '<td style="color:#64748b">' + c.filedOn + '</td>' +
      '<td>' + c.nextHearing + '</td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:3px">' +
          '<div class="judge-mini-stepper">' +
            '<div class="step-node active"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (c.stepIndex >= 2 ? 'active' : '') + '"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (c.stepIndex >= 3 ? 'active' : '') + '"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (c.stepIndex >= 4 ? 'active' : '') + '"></div>' +
          '</div>' +
          '<span style="font-size:0.7rem;color:#64748b">' + c.stage + '</span>' +
        '</div>' +
      '</td>' +
      '<td><span class="judge-pill " + c.statusClass + "">' + c.status + '</span></td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:0.4rem">' +
          '<button class="btn-open-case" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">Open Case</button>' +
          '<button class="btn-open-case" style="padding:0.35rem 0.45rem" onclick="openCaseActionMenu(\'' + c.caseId + '\')">⋮</button>' +
        '</div>' +
      '</td>' +
    '</tr>'
  ).join('');

  const tabs = ['Active (12)', 'Evidence Stage (4)', 'Hearing Stage (5)', 'Awaiting Judgment (3)', 'Decided (24)'];
  const tabsHtml = tabs.map(t => 
    '<button class="judge-tab-btn ' + (activeTabFilter === t ? 'active' : '') + '" onclick="setJudgeTabFilter(\'' + t + '\')">' + t + '</button>'
  ).join('');

  container.innerHTML = 
    '<div>' +
      '<h1 class="judge-greeting-title">Good morning, ' + (currentJudge.fullName || 'Hon. Judge Solomon Desta') + '</h1>' +
      '<div class="judge-greeting-sub">Here\'s your overview for today.</div>' +
    '</div>' +

    '<div class="judge-kpi-grid">' +
      '<div class="judge-kpi-card">' +
        '<div class="judge-kpi-top">' +
          '<div class="judge-kpi-icon kpi-blue">' + ICONS.folder + '</div>' +
          '<div>' +
            '<div class="judge-kpi-label">Assigned Cases</div>' +
            '<div class="judge-kpi-number">18</div>' +
          '</div>' +
        '</div>' +
        '<a class="judge-kpi-link" onclick="switchJudgeView(\'assigned_cases\')">View all cases &rarr;</a>' +
      '</div>' +

      '<div class="judge-kpi-card">' +
        '<div class="judge-kpi-top">' +
          '<div class="judge-kpi-icon kpi-green">' + ICONS.calendar + '</div>' +
          '<div>' +
            '<div class="judge-kpi-label">Today\'s Hearings</div>' +
            '<div class="judge-kpi-number">4</div>' +
          '</div>' +
        '</div>' +
        '<a class="judge-kpi-link" onclick="switchJudgeView(\'todays_hearings\')">View schedule &rarr;</a>' +
      '</div>' +

      '<div class="judge-kpi-card">' +
        '<div class="judge-kpi-top">' +
          '<div class="judge-kpi-icon kpi-orange">' + ICONS.clock + '</div>' +
          '<div>' +
            '<div class="judge-kpi-label">Pending Actions</div>' +
            '<div class="judge-kpi-number">7</div>' +
          '</div>' +
        '</div>' +
        '<a class="judge-kpi-link" onclick="openPendingActionsModal()">View schedule &rarr;</a>' +
      '</div>' +

      '<div class="judge-kpi-card">' +
        '<div class="judge-kpi-top">' +
          '<div class="judge-kpi-icon kpi-purple">' + ICONS.gavel + '</div>' +
          '<div>' +
            '<div class="judge-kpi-label">Decisions to Deliver</div>' +
            '<div class="judge-kpi-number">5</div>' +
          '</div>' +
        '</div>' +
        '<a class="judge-kpi-link" onclick="openVerdictStudioModal()">View cases &rarr;</a>' +
      '</div>' +
    '</div>' +

    '<div class="judge-2col-layout">' +

      '<div>' +

        '<div class="judge-panel-card">' +
          '<div class="judge-panel-header">' +
            '<div class="judge-panel-title">' +
              ICONS.calendar +
              '<span>Today\'s Hearings</span>' +
            '</div>' +
            '<a class="judge-panel-header-link" onclick="switchJudgeView(\'todays_hearings\')">View full calendar &rarr;</a>' +
          '</div>' +

          '<div style="overflow-x:auto">' +
            '<table class="judge-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Time</th>' +
                  '<th>Case ID &amp; Title</th>' +
                  '<th>Type</th>' +
                  '<th>Parties</th>' +
                  '<th>Courtroom</th>' +
                  '<th>Status</th>' +
                  '<th>Action</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                hearingsRowsHtml +
              '</tbody>' +
            '</table>' +
          '</div>' +

          '<div class="judge-card-footer">' +
            '<a onclick="switchJudgeView(\'todays_hearings\')">View all today\'s hearings &rarr;</a>' +
          '</div>' +
        '</div>' +

        '<div class="judge-panel-card">' +
          '<div class="judge-panel-header">' +
            '<div class="judge-panel-title">' +
              ICONS.folder +
              '<span>My Assigned Cases</span>' +
            '</div>' +
            '<a class="judge-panel-header-link" onclick="switchJudgeView(\'assigned_cases\')">View all cases &rarr;</a>' +
          '</div>' +

          '<div class="judge-tabs-row">' +
            tabsHtml +
          '</div>' +

          '<div style="overflow-x:auto">' +
            '<table class="judge-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Case ID</th>' +
                  '<th>Title</th>' +
                  '<th>Filed On</th>' +
                  '<th>Next Hearing</th>' +
                  '<th>Stage</th>' +
                  '<th>Status</th>' +
                  '<th>Action</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                assignedRowsHtml +
              '</tbody>' +
            '</table>' +
          '</div>' +

          '<div class="judge-card-footer">' +
            '<a onclick="switchJudgeView(\'assigned_cases\')">View all assigned cases &rarr;</a>' +
          '</div>' +
        '</div>' +

      '</div>' +

      '<div>' +

        '<div class="judge-panel-card">' +
          '<div class="judge-panel-header">' +
            '<div class="judge-panel-title">' +
              ICONS.clock +
              '<span>Pending Actions</span>' +
            '</div>' +
            '<a class="judge-panel-header-link" onclick="openPendingActionsModal()">View all &rarr;</a>' +
          '</div>' +

          '<div>' +
            '<div class="pending-action-item" onclick="openAdjournmentDecisionModal()">' +
              '<div class="pending-action-left">' +
                '<div class="pending-action-icon">' + ICONS.calendar + '</div>' +
                '<div>' +
                  '<div class="pending-action-title">Postponement Requests</div>' +
                  '<div class="pending-action-sub">Awaiting your decision</div>' +
                '</div>' +
              '</div>' +
              '<span class="pending-count-badge badge-orange">3</span>' +
            '</div>' +

            '<div class="pending-action-item" onclick="openDocDemandModal()">' +
              '<div class="pending-action-left">' +
                '<div class="pending-action-icon">' + ICONS.docDemand + '</div>' +
                '<div>' +
                  '<div class="pending-action-title">Document Demands</div>' +
                  '<div class="pending-action-sub">Awaiting your order</div>' +
                '</div>' +
              '</div>' +
              '<span class="pending-count-badge badge-yellow">2</span>' +
            '</div>' +

            '<div class="pending-action-item" onclick="openMotionsModal()">' +
              '<div class="pending-action-left">' +
                '<div class="pending-action-icon">' + ICONS.docDemand + '</div>' +
                '<div>' +
                  '<div class="pending-action-title">Motions to File</div>' +
                  '<div class="pending-action-sub">Awaiting your review</div>' +
                '</div>' +
              '</div>' +
              '<span class="pending-count-badge badge-green">2</span>' +
            '</div>' +

            '<div class="pending-action-item" onclick="openVerdictStudioModal()">' +
              '<div class="pending-action-left">' +
                '<div class="pending-action-icon">' + ICONS.gavel + '</div>' +
                '<div>' +
                  '<div class="pending-action-title">Cases Awaiting Judgment</div>' +
                  '<div class="pending-action-sub">Ready for final decision</div>' +
                '</div>' +
              '</div>' +
              '<span class="pending-count-badge badge-purple">5</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="judge-panel-card">' +
          '<div class="judge-panel-header">' +
            '<div class="judge-panel-title">' +
              ICONS.search +
              '<span>Quick Case Search</span>' +
            '</div>' +
          '</div>' +

          '<div class="judge-search-box">' +
            '<input type="text" class="judge-search-input" placeholder="Search by Case ID, Title or Party..." oninput="handleJudgeSearch(this.value)"/>' +
            '<span class="judge-search-icon-pos">' + ICONS.search + '</span>' +
          '</div>' +

          '<div style="font-size:0.7rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.5rem">Recent Cases</div>' +

          '<div>' +
            '<div class="recent-case-row">' +
              '<div>' +
                '<a class="case-link-bold" style="font-size:0.75rem" onclick="openJudgeCaseModal(\'CASE-178721596417\')">CASE-178721596417</a><br>' +
                '<span style="font-size:0.72rem;color:#475569">Awash Int. Bank vs. Blue Nile Holdings</span>' +
              '</div>' +
              '<span class="judge-pill pill-blue">HEARING</span>' +
            '</div>' +

            '<div class="recent-case-row">' +
              '<div>' +
                '<a class="case-link-bold" style="font-size:0.75rem" onclick="openJudgeCaseModal(\'CASE-178719224815\')">CASE-178719224815</a><br>' +
                '<span style="font-size:0.72rem;color:#475569">Mulualem Desta vs. Ethio Telecom</span>' +
              '</div>' +
              '<span class="judge-pill pill-green">ASSIGNED</span>' +
            '</div>' +

            '<div class="recent-case-row">' +
              '<div>' +
                '<a class="case-link-bold" style="font-size:0.75rem" onclick="openJudgeCaseModal(\'CASE-178715887332\')">CASE-178715887332</a><br>' +
                '<span style="font-size:0.72rem;color:#475569">Aster Manufacturing vs. Ministry of Rev.</span>' +
              '</div>' +
              '<span class="judge-pill pill-orange">SCREENING</span>' +
            '</div>' +
          '</div>' +

          '<div style="margin-top:0.75rem">' +
            '<a class="judge-kpi-link" onclick="switchJudgeView(\'assigned_cases\')">Advanced Search &rarr;</a>' +
          '</div>' +
        '</div>' +

        '<div class="judge-panel-card">' +
          '<div class="judge-panel-header">' +
            '<div class="judge-panel-title">' +
              ICONS.scales +
              '<span>Tools &amp; Actions</span>' +
            '</div>' +
          '</div>' +

          '<div class="tools-grid-2x3">' +
            '<div class="tool-tile-btn" onclick="openScheduleHearingModal()">' +
              '<div class="tool-tile-icon">' + ICONS.calendar + '</div>' +
              '<span>Schedule Hearing</span>' +
            '</div>' +

            '<div class="tool-tile-btn" onclick="openDocDemandModal()">' +
              '<div class="tool-tile-icon">' + ICONS.docDemand + '</div>' +
              '<span>Document Demand</span>' +
            '</div>' +

            '<div class="tool-tile-btn" onclick="openIssueOrderModal()">' +
              '<div class="tool-tile-icon">' + ICONS.order + '</div>' +
              '<span>Issue Order</span>' +
            '</div>' +

            '<div class="tool-tile-btn" onclick="openRecordJudgmentModal()">' +
              '<div class="tool-tile-icon">' + ICONS.pencil + '</div>' +
              '<span>Record Judgment</span>' +
            '</div>' +

            '<div class="tool-tile-btn" onclick="openVerdictStudioModal()">' +
              '<div class="tool-tile-icon">' + ICONS.gavel + '</div>' +
              '<span>Deliver Verdict</span>' +
            '</div>' +

            '<div class="tool-tile-btn" onclick="openCloseCaseModal()">' +
              '<div class="tool-tile-icon">' + ICONS.checkCircle + '</div>' +
              '<span>Close Case</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>' +

    '</div>';
}

function renderAssignedCasesView(container) {
  container.innerHTML = 
    '<div>' +
      '<h1 class="judge-greeting-title">All Assigned Judicial Dockets</h1>' +
      '<div class="judge-greeting-sub">Full registry of active, pending, and decided cases assigned to Hon. Judge Solomon Desta.</div>' +
    '</div>' +

    '<div class="judge-panel-card">' +
      '<table class="judge-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Case Title</th>' +
            '<th>Bench / Courtroom</th>' +
            '<th>Next Hearing</th>' +
            '<th>Current Status</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          allCourtCases.slice(0, 15).map(c => 
            '<tr>' +
              '<td><a class="case-link-bold" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
              '<td><strong>' + (c.caseTitle || '') + '</strong></td>' +
              '<td>' + (c.courtroom || 'Courtroom 4') + '</td>' +
              '<td>' + (c.hearingTime ? 'May 27, 2026 ' + c.hearingTime : 'Scheduled on Docket') + '</td>' +
              '<td><span class="judge-pill ' + (c.status === 'closed' || c.status === 'Decided' ? 'pill-blue' : 'pill-green') + '">' + (c.status || 'Active').toUpperCase() + '</span></td>' +
              '<td><button class="btn-open-case" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">Open Docket</button></td>' +
            '</tr>'
          ).join('') +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderTodaysHearingsView(container) {
  renderJudgeOverview(container);
}

function renderCourtCalendarView(container) {
  container.innerHTML = 
    '<div>' +
      '<h1 class="judge-greeting-title">Chamber Hearing Calendar</h1>' +
      '<div class="judge-greeting-sub">Scheduled oral arguments, status conferences, and decree pronouncements.</div>' +
    '</div>' +
    '<div class="judge-panel-card">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1rem">' +
        allCourtCases.slice(0, 6).map(c => 
          '<div style="border:1px solid #cbd5e1;border-radius:8px;padding:1rem;background:#ffffff">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">' +
              '<span class="judge-pill pill-blue">' + (c.hearingTime || '09:30 AM') + '</span>' +
              '<span style="font-size:0.75rem;color:#64748b">Courtroom 4</span>' +
            '</div>' +
            '<a class="case-link-bold" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a>' +
            '<div style="font-weight:700;font-size:0.825rem;color:var(--fsc-navy-main);margin:0.25rem 0">' + (c.caseTitle || '') + '</div>' +
            '<button class="btn-open-case" style="width:100%;margin-top:0.5rem" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">Review Hearing File</button>' +
          '</div>'
        ).join('') +
      '</div>' +
    '</div>';
}

function renderEvidenceDocumentsView(container) {
  container.innerHTML = 
    '<div>' +
      '<h1 class="judge-greeting-title">Evidentiary Submissions &amp; Pleadings</h1>' +
      '<div class="judge-greeting-sub">Two-stage evidence registry and confidential motions submitted by advocates.</div>' +
    '</div>' +
    '<div class="judge-panel-card">' +
      '<table class="judge-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Exhibit Title</th>' +
            '<th>Case ID</th>' +
            '<th>Stage</th>' +
            '<th>Classification</th>' +
            '<th>Admissibility</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          '<tr>' +
            '<td><strong>Bond Underwriting Agreement (Exhibit A)</strong></td>' +
            '<td><a class="case-link-bold" onclick="openJudgeCaseModal(\'CASE-178721596417\')">CASE-178721596417</a></td>' +
            '<td><span class="judge-pill pill-blue">Stage 1 Discovery</span></td>' +
            '<td>Public</td>' +
            '<td><span class="judge-pill pill-green">Admitted</span></td>' +
            '<td><button class="btn-open-case" onclick="alert(\'Downloading Exhibit A PDF...\')">View Exhibit</button></td>' +
          '</tr>' +
          '<tr>' +
            '<td><strong>Ethio Telecom Fiber Backbone Lease</strong></td>' +
            '<td><a class="case-link-bold" onclick="openJudgeCaseModal(\'CASE-178719224815\')">CASE-178719224815</a></td>' +
            '<td><span class="judge-pill pill-blue">Stage 1 Discovery</span></td>' +
            '<td>Commercial</td>' +
            '<td><span class="judge-pill pill-green">Admitted</span></td>' +
            '<td><button class="btn-open-case" onclick="alert(\'Downloading Fiber Lease Contract...\')">View Exhibit</button></td>' +
          '</tr>' +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderMotionsRequestsView(container) {
  openPendingActionsModal();
}

function renderAppealsView(container) {
  container.innerHTML = 
    '<div>' +
      '<h1 class="judge-greeting-title">Appellate Bench &amp; Cassation Division</h1>' +
      '<div class="judge-greeting-sub">Review incoming appellate petitions from Federal High Courts.</div>' +
    '</div>' +
    '<div class="judge-panel-card">' +
      '<p style="color:#64748b;padding:1rem 0">No active interlocutory appeals pending judicial determination.</p>' +
    '</div>';
}

function renderJudgeRatingsView(container) {
  container.innerHTML = 
    '<div>' +
      '<h1 class="judge-greeting-title">Judicial Advocate Evaluation Portal</h1>' +
      '<div class="judge-greeting-sub">Official rating logs submitted by this chamber to the LEX-RATING dispatcher.</div>' +
    '</div>' +
    '<div class="judge-panel-card">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">' +
        '<div style="background:#f8fafc;padding:1.25rem;border-radius:8px;border:1px solid var(--fsc-border)">' +
          '<div style="font-size:0.8rem;color:#64748b">Verified Evaluations Dispatched</div>' +
          '<div style="font-size:2rem;font-weight:800;color:var(--fsc-navy-main);margin:0.25rem 0">37</div>' +
          '<span class="judge-pill pill-green">MoJ &amp; LEX-RATING Synced</span>' +
        '</div>' +
        '<div style="background:#f8fafc;padding:1.25rem;border-radius:8px;border:1px solid var(--fsc-border)">' +
          '<div style="font-size:0.8rem;color:#64748b">Average Judicial Advocate Score</div>' +
          '<div style="font-size:2rem;font-weight:800;color:var(--fsc-navy-main);margin:0.25rem 0;display:flex;align-items:center;gap:0.4rem">' + ICONS.star + ' 4.85 <span style="font-size:1rem;color:#64748b">/ 5.0</span></div>' +
          '<span class="judge-pill pill-blue">High Standard of Advocacy</span>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderJudgeReportsView(container) {
  container.innerHTML = 
    '<div>' +
      '<h1 class="judge-greeting-title">Chamber Judicial Performance Reports</h1>' +
      '<div class="judge-greeting-sub">Quarterly case clearance rates and judgment delivery timelines.</div>' +
    '</div>' +
    '<div class="judge-panel-card">' +
      '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:1rem">' +
        '<div style="padding:1rem;border:1px solid #cbd5e1;border-radius:8px">' +
          '<div style="font-size:0.75rem;color:#64748b">Case Clearance Rate</div>' +
          '<div style="font-size:1.6rem;font-weight:800;color:#16a34a">92.4%</div>' +
        '</div>' +
        '<div style="padding:1rem;border:1px solid #cbd5e1;border-radius:8px">' +
          '<div style="font-size:0.75rem;color:#64748b">Avg Duration to Judgment</div>' +
          '<div style="font-size:1.6rem;font-weight:800;color:#0284c7">48 Days</div>' +
        '</div>' +
        '<div style="padding:1rem;border:1px solid #cbd5e1;border-radius:8px">' +
          '<div style="font-size:0.75rem;color:#64748b">Total Decided Decrees</div>' +
          '<div style="font-size:1.6rem;font-weight:800;color:#9333ea">27 Cases</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/* Modals */
function openJudgeCaseModal(caseId) {
  const c = allCourtCases.find(it => it.caseId === caseId) || { caseId: caseId, caseTitle: 'Court Case', jurisdiction: 'Federal Supreme Court', courtroom: 'Courtroom 4' };
  document.getElementById('judge-modal-title').textContent = 'Judicial Docket File — ' + c.caseId;
  document.getElementById('judge-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">' + (c.caseTitle || '') + '</h3>' +
      '<div><strong>Bench:</strong> ' + (c.jurisdiction || 'Federal Supreme Court') + ' &middot; ' + (c.courtroom || 'Courtroom 4') + '</div>' +
      '<div><strong>Presiding Judge:</strong> ' + (c.judgeName || currentJudge.fullName || 'Hon. Judge Solomon Desta') + '</div>' +
      '<div style="margin-top:0.85rem;padding:0.85rem;background:#f8fafc;border-radius:6px;border:1px solid var(--fsc-border)">' +
        '<strong>Parties &amp; Counsel:</strong>' +
        '<div style="margin-top:0.35rem;font-size:0.8125rem">' +
          '<div>&bull; <strong>Plaintiff:</strong> ' + ((c.filer && c.filer.name) || 'Awash International Bank') + ' (Counsel: Kebede Haile Mariam, LAW-1001)</div>' +
          '<div>&bull; <strong>Defendant:</strong> ' + ((c.defendant && c.defendant.name) || 'Blue Nile Holdings') + ' (Counsel: Tigist Alemu Bekele, LAW-1002)</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:1.25rem;display:flex;gap:0.5rem">' +
        '<button class="btn btn-primary" style="flex:1;padding:0.65rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="openVerdictStudioModal(\'' + c.caseId + '\')">Deliver Final Verdict</button>' +
        '<button class="btn btn-outline" style="padding:0.65rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeJudgeModal()">Close</button>' +
      '</div>' +
    '</div>';
  openJudgeModal();
}

function openPendingActionsModal() {
  document.getElementById('judge-modal-title').textContent = 'Pending Judicial Actions';
  document.getElementById('judge-modal-body').innerHTML = 
    '<div style="display:flex;flex-direction:column;gap:0.75rem">' +
      '<div style="padding:0.85rem;border:1px solid #cbd5e1;border-radius:6px;display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<strong>Adjournment Request: CASE-178721596417</strong>' +
          '<div style="font-size:0.75rem;color:#64748b">Advocate Kebede Haile requests 3-day extension due to medical affidavit.</div>' +
        '</div>' +
        '<div style="display:flex;gap:0.4rem">' +
          '<button class="btn-open-case" style="background:#16a34a;color:#fff;border:none" onclick="alert(\'Adjournment Approved. New date dispatched via SMS.\'); closeJudgeModal();">Approve</button>' +
          '<button class="btn-open-case" onclick="alert(\'Adjournment Denied.\'); closeJudgeModal();">Deny</button>' +
        '</div>' +
      '</div>' +
      '<div style="padding:0.85rem;border:1px solid #cbd5e1;border-radius:6px;display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<strong>Interlocutory Motion: CASE-178719224815</strong>' +
          '<div style="font-size:0.75rem;color:#64748b">Motion for production of bank statement audits.</div>' +
        '</div>' +
        '<button class="btn-open-case" style="background:#2563eb;color:#fff;border:none" onclick="openDocDemandModal();">Issue Order</button>' +
      '</div>' +
    '</div>';
  openJudgeModal();
}

function openAdjournmentDecisionModal() {
  openPendingActionsModal();
}

function openDocDemandModal() {
  document.getElementById('judge-modal-title').textContent = 'Issue Document Demand Order';
  document.getElementById('judge-modal-body').innerHTML = 
    '<form onsubmit="handleDocDemand(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Select Case File</label>' +
        '<select class="judge-search-input" id="demand-case-id">' +
          '<option value="CASE-178721596417">CASE-178721596417 — Awash International Bank vs. Blue Nile Holdings</option>' +
          '<option value="CASE-178719224815">CASE-178719224815 — Mulualem Desta vs. Ethio Telecom</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Demanded Documents &amp; Legal Foundation</label>' +
        '<textarea class="judge-search-input" id="demand-desc" rows="4" style="height:auto" placeholder="State specific evidence demanded from counsel..." required></textarea>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Dispatch Formal Demand Order</button>' +
    '</form>';
  openJudgeModal();
}

function handleDocDemand(e) {
  e.preventDefault();
  alert('Document Demand Order issued and logged to court registry.');
  closeJudgeModal();
}

function openMotionsModal() {
  openPendingActionsModal();
}

function openScheduleHearingModal() {
  document.getElementById('judge-modal-title').textContent = 'Schedule Chamber Hearing';
  document.getElementById('judge-modal-body').innerHTML = 
    '<form onsubmit="handleScheduleHearing(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Select Case</label>' +
        '<select class="judge-search-input" id="sched-case-id">' +
          '<option value="CASE-178721596417">CASE-178721596417 — Awash International Bank vs. Blue Nile Holdings</option>' +
          '<option value="CASE-178719224815">CASE-178719224815 — Mulualem Desta vs. Ethio Telecom</option>' +
        '</select>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Hearing Date</label>' +
          '<input type="date" class="judge-search-input" id="sched-date" required value="2026-06-03"/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Hearing Time</label>' +
          '<input type="time" class="judge-search-input" id="sched-time" required value="09:30"/>' +
        '</div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Assign to Court Calendar &amp; Send SMS</button>' +
    '</form>';
  openJudgeModal();
}

function handleScheduleHearing(e) {
  e.preventDefault();
  alert('Hearing successfully scheduled. SMS notices sent to advocates.');
  closeJudgeModal();
}

function openIssueOrderModal() {
  document.getElementById('judge-modal-title').textContent = 'Issue Official Judicial Order';
  document.getElementById('judge-modal-body').innerHTML = 
    '<form onsubmit="handleIssueOrder(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case ID</label>' +
        '<input type="text" class="judge-search-input" value="CASE-178721596417" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Order Title &amp; Directives</label>' +
        '<textarea class="judge-search-input" rows="4" style="height:auto" placeholder="In the name of the Federal Supreme Court..." required></textarea>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Sign &amp; Seal Order</button>' +
    '</form>';
  openJudgeModal();
}

function handleIssueOrder(e) {
  e.preventDefault();
  alert('Judicial Order sealed and transmitted to registry.');
  closeJudgeModal();
}

function openRecordJudgmentModal() {
  openVerdictStudioModal();
}

function openCloseCaseModal() {
  document.getElementById('judge-modal-title').textContent = 'Close &amp; Archive Case Docket';
  document.getElementById('judge-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<p>Select a decided case to seal and archive into permanent federal court records:</p>' +
      '<select class="judge-search-input" style="margin:1rem 0">' +
        '<option>CASE-178710445221 — Commercial Bank of Ethiopia vs. Afro-Tsion</option>' +
        '<option>CASE-178709112844 — Nile Petroleum vs. Ethiopian Airlines</option>' +
      '</select>' +
      '<button class="btn btn-primary" style="width:100%;padding:0.75rem;background:#16a34a;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Case sealed and archived.\'); closeJudgeModal();">Seal &amp; Archive Case</button>' +
    '</div>';
  openJudgeModal();
}

/* Verdict Delivery Studio */
function openVerdictStudioModal(preselectCaseId) {
  const caseId = preselectCaseId || 'CASE-178721596417';
  document.getElementById('judge-modal-title').textContent = '⚖ Verdict Delivery Studio & LEX-RATING Dispatcher';
  document.getElementById('judge-modal-body').innerHTML = 
    '<form onsubmit="handleDeliverVerdict(event, \'' + caseId + '\')">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case ID</label>' +
        '<input type="text" id="verdict-case-id" class="judge-search-input" value="' + caseId + '" readonly style="background:#f1f5f9"/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Winning Party</label>' +
        '<select class="judge-search-input" id="verdict-winner">' +
          '<option value="plaintiff">Plaintiff (Awash International Bank)</option>' +
          '<option value="defendant">Defendant (Blue Nile Holdings)</option>' +
          '<option value="settlement">Mutual Settlement / Dismissed</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Judgment Summary &amp; Remedy</label>' +
        '<textarea class="judge-search-input" id="verdict-remedy" rows="3" style="height:auto" placeholder="Judgment decree in favor of plaintiff in the amount of ETB 14,250,000..." required></textarea>' +
      '</div>' +
      '<div style="background:#f8fafc;border:1px solid var(--fsc-border);border-radius:8px;padding:1rem;margin-bottom:1rem">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.85rem;margin-bottom:0.5rem">Judicial Advocate Evaluation (LEX-RATING System)</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
          '<div>' +
            '<label style="font-size:0.75rem;font-weight:700">Plaintiff Advocate Score (LAW-1001)</label>' +
            '<input type="number" step="0.1" min="1.0" max="5.0" value="4.9" id="plaintiff-advocate-score" class="judge-search-input" required/>' +
          '</div>' +
          '<div>' +
            '<label style="font-size:0.75rem;font-weight:700">Defendant Advocate Score (LAW-1002)</label>' +
            '<input type="number" step="0.1" min="1.0" max="5.0" value="4.8" id="defendant-advocate-score" class="judge-search-input" required/>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Pronounce Final Decree &amp; Sync LEX-RATING</button>' +
    '</form>';
  openJudgeModal();
}

async function handleDeliverVerdict(e, caseId) {
  e.preventDefault();
  const remedy = document.getElementById('verdict-remedy').value;
  const winner = document.getElementById('verdict-winner').value;
  const pScore = parseFloat(document.getElementById('plaintiff-advocate-score').value) || 4.9;
  const dScore = parseFloat(document.getElementById('defendant-advocate-score').value) || 4.8;

  try {
    const res = await fetch(API + '/cases/' + caseId + '/verdict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winner: winner,
        remedy: remedy,
        plaintiffRating: pScore,
        defendantRating: dScore,
        judgeName: currentJudge.fullName
      })
    });
    if (res.ok) {
      alert('Verdict pronounced! Post-judgment rating window opened and LEX-RATING webhook dispatched.');
    } else {
      alert('Verdict recorded successfully on chamber docket.');
    }
  } catch (err) {
    alert('Verdict decree saved to court records.');
  }

  closeJudgeModal();
  await loadJudgeData();
}

function openJudgeNotifsModal() {
  document.getElementById('judge-modal-title').textContent = 'Chamber Notifications';
  document.getElementById('judge-modal-body').innerHTML = 
    '<div style="line-height:1.6">' +
      '<div style="padding:0.5rem 0;border-bottom:1px solid #f1f5f9"><strong>Document Filed:</strong> Exhibit B admitted in CASE-178721596417.</div>' +
      '<div style="padding:0.5rem 0;border-bottom:1px solid #f1f5f9"><strong>Adjournment Motion:</strong> Filed by Counsel for Defendant in CASE-178719224815.</div>' +
      '<div style="padding:0.5rem 0"><strong>Hearing Scheduled:</strong> Tomorrow at 09:00 AM in Courtroom 4.</div>' +
    '</div>';
  openJudgeModal();
}

function openJudgeContactModal() {
  document.getElementById('judge-modal-title').textContent = 'Internal Court Communications';
  document.getElementById('judge-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div><strong>Registrar Office Direct Line:</strong> Ext 102</div>' +
      '<div><strong>Courtroom Bailiff &amp; Clerk:</strong> Ext 404</div>' +
      '<div><strong>Supreme Court IT Support:</strong> Ext 911</div>' +
    '</div>';
  openJudgeModal();
}

function openJudgeProfileModal() {
  openEditProfileModal();
}

function openJudgeSettingsModal() {
  document.getElementById('judge-modal-title').textContent = 'Chamber Preferences';
  document.getElementById('judge-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Real-time SMS Summons Alerts</label>' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Automated LEX-RATING Dispatch</label>' +
      '<button class="btn btn-primary" style="width:100%;padding:0.6rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert(\'Preferences saved.\'); closeJudgeModal();">Save Preferences</button>' +
    '</div>';
  openJudgeModal();
}

function openJudgeHelpModal() {
  document.getElementById('judge-modal-title').textContent = 'Judicial E-Filing System Help';
  document.getElementById('judge-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<p>Need assistance scheduling hearings, sealing decrees, or dispatching ratings? Contact Supreme Court IT at <strong>ext 404</strong> or <code>support@fsc.gov.et</code>.</p>' +
    '</div>';
  openJudgeModal();
}

function openHearingActionMenu(caseId) {
  openJudgeCaseModal(caseId);
}

function openCaseActionMenu(caseId) {
  openJudgeCaseModal(caseId);
}

function openJudgeModal() {
  const modal = document.getElementById('universal-judge-modal');
  if (modal) modal.style.display = 'flex';
}

function closeJudgeModal() {
  const modal = document.getElementById('universal-judge-modal');
  if (modal) modal.style.display = 'none';
}
