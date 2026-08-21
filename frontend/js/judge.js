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
let allCourtCases = [];
let activeTabFilter = 'All';
let searchQuery = '';

const ICONS = {
  briefcase: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  gavel: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/></svg>',
  scales: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  checkCircle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'judge' || u.role === 'admin') currentJudge = Object.assign(currentJudge, u);
    }
  } catch (e) {}

  updateJudgeHeaderUI();
  startJudgeLiveClock();
  await loadJudgeData();
});

function startJudgeLiveClock() {
  function tick() {
    const now = new Date();
    const clockEl = document.getElementById('judge-live-clock');
    if (clockEl) {
      clockEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const sideClock = document.getElementById('sidebar-live-clock');
    if (sideClock) sideClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

function updateJudgeHeaderUI() {
  const name = currentJudge.fullName || "Hon. Judge Solomon Desta";
  const initials = name.split(' ').filter(p => !p.toLowerCase().includes('hon') && !p.toLowerCase().includes('judge')).map(p => p[0]).join('').substring(0, 2) || "SD";
  
  const headerNameEl = document.getElementById('header-judge-name');
  if (headerNameEl) headerNameEl.textContent = name;

  const topNameEl = document.getElementById('top-judge-name') || document.getElementById('top-judge-display-name');
  if (topNameEl) topNameEl.textContent = name;
  
  const initialsEl = document.getElementById('judge-avatar-initials');
  if (initialsEl) initialsEl.textContent = initials;

  const dropInitialsEl = document.getElementById('dropdown-avatar-circle');
  if (dropInitialsEl) dropInitialsEl.textContent = initials;

  const dropNameEl = document.getElementById('judge-dropdown-fullname') || document.getElementById('dropdown-user-fullname');
  if (dropNameEl) dropNameEl.textContent = name;
}

function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('judge-profile-dropdown-menu');
  if (!menu) return;
  const isVisible = menu.classList.contains('show') || menu.style.display === 'flex' || menu.style.display === 'block';
  if (isVisible) {
    menu.classList.remove('show');
    menu.style.display = 'none';
  } else {
    menu.classList.add('show');
    menu.style.display = 'flex';
  }
}
window.toggleProfileDropdown = toggleProfileDropdown;
window.toggleJudgeProfileDropdown = toggleProfileDropdown;

function handleJudgeGlobalClick(e) {
  const menu = document.getElementById('judge-profile-dropdown-menu');
  const trigger = document.getElementById('judge-profile-pill-trigger');
  if (menu && (menu.classList.contains('show') || menu.style.display === 'flex' || menu.style.display === 'block')) {
    if (!menu.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
      menu.classList.remove('show');
      menu.style.display = 'none';
    }
  }
}

async function loadJudgeData() {
  try {
    const res = await fetch(API + '/cases').catch(() => null);
    if (res && res.ok) allCourtCases = await res.json();
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

function renderJudgeCurrentView() {
  const container = document.getElementById('dynamic-judge-workspace');
  if (!container) return;

  if (currentJudgeView === 'assigned_cases') {
    renderAssignedCasesView(container);
  } else if (currentJudgeView === 'todays_hearings') {
    renderCourtCalendarView(container);
  } else {
    renderJudgeOverview(container);
  }
}

// ── 1. Judge Overview Dashboard ──
function renderJudgeOverview(container) {
  const assignedCases = allCourtCases.filter(c => {
    if (!c.judgeName) return true;
    return c.judgeName.toLowerCase().includes('solomon') || c.judgeId === currentJudge.id;
  });

  const scheduledHearings = allCourtCases.filter(c => c.hearingDate && (c.status === 'scheduled' || c.status === 'hearing'));
  const decidedCases = allCourtCases.filter(c => c.status === 'closed' || c.status === 'Decided' || c.finalVerdict);
  const pendingOrders = allCourtCases.filter(c => c.status === 'forwarded_to_branch' || c.status === 'pending_screening');

  const hearingsRowsHtml = scheduledHearings.length ? scheduledHearings.slice(0, 6).map(h => {
    return '<tr>' +
      '<td><span style="font-weight:800;color:var(--fsc-navy-main)">' + (h.hearingTime || '09:30 AM') + '</span></td>' +
      '<td>' +
        '<a class="case-link-bold" onclick="openJudgeCaseModal(\'' + h.caseId + '\')">' + h.caseId + '</a><br>' +
        '<span style="font-size:0.75rem;color:#475569">' + (h.caseTitle || h.petitioner + ' vs. ' + h.respondent) + '</span>' +
      '</td>' +
      '<td style="color:#475569">' + (h.caseCategory || h.caseType || 'Civil Hearing') + '</td>' +
      '<td><span class="status-pill pill-navy">' + (h.courtroom || 'Courtroom 4') + '</span></td>' +
      '<td><span class="status-pill pill-green">SESSION SCHEDULED</span></td>' +
      '<td><button class="btn-open-case" onclick="openJudgeCaseModal(\'' + h.caseId + '\')">Open Docket</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem">No scheduled hearings on today\'s roster.</td></tr>';

  const assignedRowsHtml = assignedCases.length ? assignedCases.slice(0, 6).map(c => {
    const filedDate = c.filingDate ? new Date(c.filingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent';
    let stepIndex = 1;
    let stage = 'Assigned';
    if (c.status === 'scheduled' || c.status === 'hearing') { stepIndex = 2; stage = 'Hearing Stage'; }
    else if (c.status === 'closed' || c.status === 'Decided') { stepIndex = 4; stage = 'Decided'; }

    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong></td>' +
      '<td style="color:#64748b">' + filedDate + '</td>' +
      '<td style="color:#0f172a;font-weight:700">' + (c.hearingDate || 'TBD') + '</td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:2px">' +
          '<div class="mini-stepper">' +
            '<div class="step-node active"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (stepIndex >= 2 ? 'active' : '') + '"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (stepIndex >= 3 ? 'active' : '') + '"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (stepIndex >= 4 ? 'active' : '') + '"></div>' +
          '</div>' +
          '<span style="font-size:0.685rem;color:#64748b">' + stage + '</span>' +
        '</div>' +
      '</td>' +
      '<td><span class="status-pill ' + (c.status === 'closed' || c.status === 'Decided' ? 'pill-blue' : 'pill-green') + '">' + (c.status || 'ACTIVE').toUpperCase() + '</span></td>' +
      '<td><button class="btn-open-case" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">Open Docket</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:2rem">No cases currently assigned to this chamber.</td></tr>';

  container.innerHTML = 
    '<div class="judge-greeting-row">' +
      '<div>' +
        '<h1 class="judge-greeting-title">Welcome to Chambers, ' + (currentJudge.fullName || 'Hon. Judge Solomon Desta') + '</h1>' +
        '<div class="judge-greeting-sub">Presiding Judge Chambers · Courtroom 4 · Federal Supreme Court</div>' +
      '</div>' +
    '</div>' +

    '<div class="judge-kpi-grid-4">' +
      '<div class="judge-kpi-card">' +
        '<div class="judge-kpi-top">' +
          '<div class="judge-kpi-icon kpi-blue">' + ICONS.briefcase + '</div>' +
          '<div>' +
            '<div class="judge-kpi-label">Active Caseload</div>' +
            '<div class="judge-kpi-number">' + assignedCases.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="judge-kpi-delta">Chamber dockets</div>' +
      '</div>' +

      '<div class="judge-kpi-card">' +
        '<div class="judge-kpi-top">' +
          '<div class="judge-kpi-icon kpi-green">' + ICONS.calendar + '</div>' +
          '<div>' +
            '<div class="judge-kpi-label">Scheduled Hearings</div>' +
            '<div class="judge-kpi-number">' + scheduledHearings.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="judge-kpi-delta">Courtroom trial sessions</div>' +
      '</div>' +

      '<div class="judge-kpi-card">' +
        '<div class="judge-kpi-top">' +
          '<div class="judge-kpi-icon kpi-orange">' + ICONS.clock + '</div>' +
          '<div>' +
            '<div class="judge-kpi-label">Pending Rulings</div>' +
            '<div class="judge-kpi-number">' + pendingOrders.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="judge-kpi-delta">Motions awaiting bench order</div>' +
      '</div>' +

      '<div class="judge-kpi-card">' +
        '<div class="judge-kpi-top">' +
          '<div class="judge-kpi-icon kpi-purple">' + ICONS.gavel + '</div>' +
          '<div>' +
            '<div class="judge-kpi-label">Delivered Verdicts</div>' +
            '<div class="judge-kpi-number">' + decidedCases.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="judge-kpi-delta">Final judicial rulings</div>' +
      '</div>' +
    '</div>' +

    '<div class="judge-panel-card">' +
      '<div class="judge-panel-head">' +
        '<div>' +
          '<div class="judge-panel-title">Today\'s Court Session Roster</div>' +
          '<div class="judge-panel-sub">Hearings scheduled in Courtroom 4.</div>' +
        '</div>' +
        '<button class="btn-view-all-link" onclick="switchJudgeView(\'todays_hearings\')">View Full Calendar &rarr;</button>' +
      '</div>' +
      '<table class="judge-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Session Time</th>' +
            '<th>Case ID &amp; Parties</th>' +
            '<th>Category</th>' +
            '<th>Courtroom</th>' +
            '<th>Status</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + hearingsRowsHtml + '</tbody>' +
      '</table>' +
    '</div>' +

    '<div class="judge-panel-card">' +
      '<div class="judge-panel-head">' +
        '<div>' +
          '<div class="judge-panel-title">Active Chamber Dockets</div>' +
          '<div class="judge-panel-sub">Master roster of assigned civil, commercial, and cassation matters.</div>' +
        '</div>' +
        '<button class="btn-view-all-link" onclick="switchJudgeView(\'assigned_cases\')">View All Cases &rarr;</button>' +
      '</div>' +
      '<table class="judge-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Case Title</th>' +
            '<th>Filing Date</th>' +
            '<th>Hearing Date</th>' +
            '<th>Progress</th>' +
            '<th>Status</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + assignedRowsHtml + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 2. Assigned Cases View ──
function renderAssignedCasesView(container) {
  const cases = allCourtCases;
  const rowsHtml = cases.length ? cases.map(c => {
    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td>' +
        '<strong style="color:var(--fsc-navy-main)">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong><br>' +
        '<span style="font-size:0.75rem;color:#64748b">Filer: ' + (c.petitioner || 'Plaintiff') + '</span>' +
      '</td>' +
      '<td><span class="status-pill pill-blue">' + (c.caseCategory || c.caseType || 'Civil Dispute') + '</span></td>' +
      '<td>' + (c.courtroom || 'Courtroom 4') + '</td>' +
      '<td style="color:#16a34a;font-weight:700">' + (c.hearingDate || 'TBD') + '</td>' +
      '<td><span class="status-pill ' + (c.status === 'closed' || c.status === 'Decided' ? 'pill-blue' : 'pill-green') + '">' + (c.status || 'ACTIVE').toUpperCase() + '</span></td>' +
      '<td><button class="btn-open-case" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">Open Docket</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:2rem">No cases found in chamber registry.</td></tr>';

  container.innerHTML = 
    '<div class="judge-greeting-row">' +
      '<div>' +
        '<h1 class="judge-greeting-title">Assigned Chamber Cases</h1>' +
        '<div class="judge-greeting-sub">Master list of all active judicial dockets before this bench.</div>' +
      '</div>' +
    '</div>' +
    '<div class="judge-panel-card">' +
      '<table class="judge-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Title &amp; Parties</th>' +
            '<th>Category</th>' +
            '<th>Courtroom</th>' +
            '<th>Hearing Date</th>' +
            '<th>Status</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 3. Court Calendar View ──
function renderCourtCalendarView(container) {
  const scheduled = allCourtCases.filter(c => c.hearingDate);
  const rowsHtml = scheduled.length ? scheduled.map(c => {
    return '<tr>' +
      '<td><span style="font-weight:800;color:var(--fsc-navy-main)">' + c.hearingDate + '</span></td>' +
      '<td><span style="font-weight:700;color:#0284c7">' + (c.hearingTime || '09:30 AM') + '</span></td>' +
      '<td><a class="case-link-bold" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td><strong>' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong></td>' +
      '<td><span class="status-pill pill-navy">' + (c.courtroom || 'Courtroom 4') + '</span></td>' +
      '<td><span class="status-pill pill-green">SCHEDULED</span></td>' +
      '<td><button class="btn-open-case" onclick="openJudgeCaseModal(\'' + c.caseId + '\')">Open Docket</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:2rem">No upcoming hearing sessions booked.</td></tr>';

  container.innerHTML = 
    '<div class="judge-greeting-row">' +
      '<div>' +
        '<h1 class="judge-greeting-title">Court Calendar &amp; Trial Sessions</h1>' +
        '<div class="judge-greeting-sub">Schedule of upcoming hearings and bench proceedings.</div>' +
      '</div>' +
    '</div>' +
    '<div class="judge-panel-card">' +
      '<table class="judge-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Hearing Date</th>' +
            '<th>Time Slot</th>' +
            '<th>Case ID</th>' +
            '<th>Title</th>' +
            '<th>Courtroom</th>' +
            '<th>Status</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 4. Full Judicial Docket Modal (Sections 3, 7, 8, 10, 11, 12) ──
function openJudgeCaseModal(caseId) {
  const c = allCourtCases.find(it => it.caseId === caseId) || { caseId, petitioner: 'Adnan', respondent: 'Dagim', caseTitle: 'Criminal Proceedings' };
  const docs = c.documents || [];
  const demands = c.documentDemands || [];
  const noteContent = c.judgeNotepad || '';

  // 1. Counsel Resolution
  const plLawyerName = (c.lawyerAppointed && (c.lawyerAppointed.lawyerName || c.lawyerAppointed.fullName || c.lawyerAppointed.name)) || 
                       c.plaintiffLawyerName || c.lawyerName || 'Advocate Tigist Assefa';
  const plLawyerLic = (c.lawyerAppointed && c.lawyerAppointed.licenseNumber) ? ' (' + c.lawyerAppointed.licenseNumber + ')' : ' (LAW-1002)';

  const defRep = c.defendantRepresentation;
  let defLawyerName = 'Self-Representation / In Person';
  if (defRep) {
    if (defRep.lawyerName) {
      defLawyerName = defRep.lawyerName + (defRep.licenseNumber ? ' (' + defRep.licenseNumber + ')' : '') + (defRep.type === 'government_lawyer' ? ' — Public Defender' : '');
    } else if (defRep.type === 'self') {
      defLawyerName = 'Self-Representation (In Person)';
    } else if (defRep.type === 'pending_choice') {
      defLawyerName = 'Awaiting Choice / In Person';
    }
  } else if (c.defendantLawyerName) {
    defLawyerName = c.defendantLawyerName;
  }

  // 2. Documents HTML
  const docsHtml = docs.length ? docs.map(d => {
    const isSealed = d.classificationStatus === 'sealed';
    const filePath = d.path ? (d.path.startsWith('http') ? d.path : '/' + d.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/')) : '#';
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:0.6rem;box-shadow:0 1px 2px rgba(0,0,0,0.03)">' +
      '<div>' +
        '<div style="display:flex;align-items:center;gap:0.4rem">' +
          '<strong style="font-size:0.85rem;color:var(--fsc-navy-main)">📄 ' + d.name + '</strong>' +
          '<span class="status-pill" style="font-size:0.65rem;background:' + (isSealed ? '#fee2e2;color:#dc2626' : '#dcfce7;color:#16a34a') + '">' + (isSealed ? 'SEALED RECORD' : 'SHARED') + '</span>' +
        '</div>' +
        '<div style="font-size:0.75rem;color:#64748b;margin-top:2px">' +
          'Uploaded by: <strong style="color:#334155">' + (d.uploadedBy || c.petitioner || 'Litigant') + '</strong> · Size: ' + (d.size || '0.02 MB') + ' · Date: ' + (d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '2026-08-21') +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;align-items:center">' +
        '<button type="button" class="btn-open-case" style="font-size:0.75rem;padding:0.35rem 0.75rem;background:#0284c7;color:#fff" onclick="viewEvidenceFile(\'' + (d.name || 'document.pdf') + '\', \'' + filePath + '\')">' +
          '👁️ View Document' +
        '</button>' +
        '<button type="button" class="btn-open-case" style="font-size:0.75rem;padding:0.35rem 0.75rem;background:' + (isSealed ? '#16a34a' : '#475569') + ';color:#fff" onclick="toggleEvidenceClassification(\'' + c.caseId + '\', \'' + d.id + '\', \'' + (isSealed ? 'shared' : 'sealed') + '\')">' +
          (isSealed ? '🔓 Share with Defense' : '🔒 Seal Record') +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('') : '<div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;color:#64748b;font-size:0.8rem;text-align:center">No evidentiary files submitted on this docket yet.</div>';

  // 3. Existing Demands HTML
  const demandsHtml = demands.length ? demands.map(dm => {
    return '<div style="padding:0.75rem 1rem;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:0.5rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<strong style="font-size:0.825rem;color:#92400e">🏛️ ' + dm.demandTitle + '</strong>' +
        '<span class="status-pill pill-amber" style="font-size:0.685rem">DEMAND ACTIVE</span>' +
      '</div>' +
      '<div style="font-size:0.75rem;color:#78350f;margin-top:2px">Target Party: <strong>' + (dm.targetParty || 'Plaintiff') + '</strong> · Deadline: <strong>' + (dm.deadline || '7 Days') + '</strong></div>' +
      (dm.description ? '<div style="font-size:0.725rem;color:#92400e;margin-top:4px;font-style:italic">"' + dm.description + '"</div>' : '') +
    '</div>';
  }).join('') : '<div style="font-size:0.775rem;color:#94a3b8;font-style:italic;margin-bottom:0.75rem">No open judicial evidence demands on this docket.</div>';

  document.getElementById('judge-modal-title').textContent = 'Chamber Docket — ' + c.caseId;
  document.getElementById('judge-modal-body').innerHTML = 
    '<!-- Tabs Navigation -->' +
    '<div style="display:flex;gap:0.4rem;border-bottom:1.5px solid #e2e8f0;padding-bottom:0.65rem;margin-bottom:1.15rem;overflow-x:auto">' +
      '<button type="button" id="tab-btn-overview" style="padding:0.45rem 0.85rem;border-radius:6px;border:1px solid #0b1a30;background:#0b1a30;color:#fff;font-size:0.8rem;font-weight:700;cursor:pointer" onclick="switchModalTab(\'overview\')">📋 Overview &amp; Parties</button>' +
      '<button type="button" id="tab-btn-evidence" style="padding:0.45rem 0.85rem;border-radius:6px;border:1px solid #cbd5e1;background:#f8fafc;color:#475569;font-size:0.8rem;font-weight:600;cursor:pointer" onclick="switchModalTab(\'evidence\')">📁 Evidence Gate &amp; Demands (' + docs.length + ')</button>' +
      '<button type="button" id="tab-btn-notepad" style="padding:0.45rem 0.85rem;border-radius:6px;border:1px solid #cbd5e1;background:#f8fafc;color:#475569;font-size:0.8rem;font-weight:600;cursor:pointer" onclick="switchModalTab(\'notepad\')">📝 Judicial Notepad</button>' +
      '<button type="button" id="tab-btn-verdict" style="padding:0.45rem 0.85rem;border-radius:6px;border:1px solid #cbd5e1;background:#f8fafc;color:#475569;font-size:0.8rem;font-weight:600;cursor:pointer" onclick="switchModalTab(\'verdict\')">⚖️ Deliver Verdict &amp; Decree</button>' +
    '</div>' +

    '<!-- Tab 1: Overview -->' +
    '<div id="modal-tab-overview">' +
      '<div style="background:#f8fafc;padding:0.85rem 1.15rem;border-radius:8px;margin-bottom:0.85rem;border:1px solid #e2e8f0">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:1.05rem">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</div>' +
        '<div style="font-size:0.785rem;color:#64748b;margin-top:3px">Case Category: <strong>' + (c.caseCategory || c.caseType || 'Criminal Proceedings') + '</strong> | Branch: ' + (c.jurisdiction || 'Federal Supreme Court (Sidist Kilo)') + '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:0.85rem">' +
        '<div style="padding:0.85rem;border:1px solid #e2e8f0;border-radius:8px;background:#ffffff">' +
          '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.825rem">Plaintiff / Complainant</div>' +
          '<div style="font-size:0.85rem;color:#0f172a;margin-top:2px;font-weight:700">' + (c.petitioner || 'Adnan') + '</div>' +
          '<div style="font-size:0.75rem;color:#0284c7;margin-top:4px;font-weight:600">⚖️ Counsel: ' + plLawyerName + plLawyerLic + '</div>' +
        '</div>' +
        '<div style="padding:0.85rem;border:1px solid #e2e8f0;border-radius:8px;background:#ffffff">' +
          '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.825rem">Accused / Defendant</div>' +
          '<div style="font-size:0.85rem;color:#0f172a;margin-top:2px;font-weight:700">' + (c.respondent || c.defendantName || 'Dagim') + '</div>' +
          '<div style="font-size:0.75rem;color:#15803d;margin-top:4px;font-weight:600">🛡️ Defense: ' + defLawyerName + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="padding:0.85rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:0.8rem;line-height:1.55;color:#334155;margin-bottom:0.85rem">' +
        '<strong style="color:var(--fsc-navy-main)">Docket Statement &amp; Charges:</strong><br/>' +
        (c.description || 'Case submitted for judicial hearing and examination of witness exhibits before the Federal Supreme Court.') +
      '</div>' +

      '<div style="padding:0.75rem 1rem;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;font-size:0.775rem;color:#0369a1;display:flex;justify-content:space-between;align-items:center">' +
        '<div><strong>Scheduled Trial:</strong> ' + (c.hearingDate || '2026-08-21') + ' at ' + (c.hearingTime || '09:30 AM') + ' · ' + (c.courtroom || 'Courtroom 4 (Main Trial Room)') + '</div>' +
        '<span style="font-weight:700">Clerk: ' + (c.clerkName || 'Kalkidan Mengistu') + '</span>' +
      '</div>' +
    '</div>' +

    '<!-- Tab 2: Evidence Gate & Demands -->' +
    '<div id="modal-tab-evidence" style="display:none">' +
      '<div style="margin-bottom:0.85rem;font-size:0.8rem;color:#475569;line-height:1.45">' +
        '<strong>Judicial Evidentiary Gate (Section 3):</strong> Review submitted exhibits, inspect file metadata, seal sensitive records, or issue judicial discovery demands.' +
      '</div>' +

      '<div style="margin-bottom:1.25rem">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.875rem;margin-bottom:0.5rem">Submitted Case Exhibits (' + docs.length + ')</div>' +
        docsHtml +
      '</div>' +

      '<div style="border-top:1px solid #e2e8f0;padding-top:1rem;margin-bottom:1rem">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.875rem;margin-bottom:0.5rem">Active Judicial Evidence Demands</div>' +
        demandsHtml +
      '</div>' +

      '<!-- Judicial Evidence Demand Form -->' +
      '<div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:8px;padding:1rem">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.875rem;margin-bottom:0.25rem">🏛️ Issue Judicial Evidence Demand Order</div>' +
        '<div style="font-size:0.75rem;color:#64748b;margin-bottom:0.75rem">Issue a binding judicial discovery subpoena to a party or investigating authority.</div>' +

        '<form onsubmit="handleDemandEvidenceSubmit(event, \'' + c.caseId + '\')">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.6rem">' +
            '<div>' +
              '<label style="font-weight:700;display:block;margin-bottom:0.25rem;font-size:0.75rem">Target Party</label>' +
              '<select id="demand-target-party" class="top-search-input" style="width:100%;font-size:0.785rem">' +
                '<option value="Plaintiff (' + (c.petitioner || 'Adnan') + ')">Plaintiff — ' + (c.petitioner || 'Adnan') + '</option>' +
                '<option value="Defendant (' + (c.respondent || c.defendantName || 'Dagim') + ')">Defendant — ' + (c.respondent || c.defendantName || 'Dagim') + '</option>' +
                '<option value="Federal Police Forensic Department">Federal Police Forensic &amp; Investigation Dept</option>' +
                '<option value="Third-Party Financial Institution">Commercial Bank / Financial Records</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label style="font-weight:700;display:block;margin-bottom:0.25rem;font-size:0.75rem">Compliance Deadline</label>' +
              '<input type="date" id="demand-deadline" class="top-search-input" style="width:100%;font-size:0.785rem" value="' + (new Date(Date.now() + 7*86400000).toISOString().split('T')[0]) + '" required/>' +
            '</div>' +
          '</div>' +

          '<div style="margin-bottom:0.6rem">' +
            '<label style="font-weight:700;display:block;margin-bottom:0.25rem;font-size:0.75rem">Required Evidence Title</label>' +
            '<input type="text" id="demand-title" class="top-search-input" style="width:100%;font-size:0.785rem" placeholder="e.g. Original Purchase Invoices, Police Investigation Log, Bank Statements" required/>' +
          '</div>' +

          '<div style="margin-bottom:0.75rem">' +
            '<label style="font-weight:700;display:block;margin-bottom:0.25rem;font-size:0.75rem">Judicial Instructions &amp; Legal Authority</label>' +
            '<textarea id="demand-desc" class="top-search-input" style="width:100%;height:60px;font-size:0.785rem;padding:0.4rem" placeholder="Order issued pursuant to Federal Supreme Court Rules. State specific documents required..."></textarea>' +
          '</div>' +

          '<button type="submit" id="btn-dispatch-demand" class="btn-schedule-action" style="width:100%;padding:0.6rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;font-size:0.8rem;cursor:pointer">' +
            '⚖️ Dispatch Judicial Evidence Demand Order' +
          '</button>' +
        '</form>' +
      '</div>' +
    '</div>' +

    '<!-- Tab 3: Notepad -->' +
    '<div id="modal-tab-notepad" style="display:none">' +
      '<div style="margin-bottom:0.5rem;font-size:0.775rem;color:#64748b">Private Judicial Scratchpad (Section 10) — Persistent across court hearings.</div>' +
      '<textarea id="judge-notepad-area" class="top-search-input" style="width:100%;height:140px;border-radius:6px;padding:0.5rem" placeholder="Enter judicial notes, questions for counsel, and trial observations...">' + noteContent + '</textarea>' +
      '<div style="text-align:right;margin-top:0.5rem">' +
        '<button type="button" class="btn-open-case" onclick="saveJudgeNotepad(\'' + c.caseId + '\')">💾 Save Notepad</button>' +
      '</div>' +
    '</div>' +

    '<!-- Tab 4: Deliver Verdict -->' +
    '<div id="modal-tab-verdict" style="display:none">' +
      '<form onsubmit="handleDeliverVerdictSubmit(event, \'' + c.caseId + '\')">' +
        '<div style="margin-bottom:0.75rem">' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">1. Final Verdict Disposition</label>' +
          '<select id="verdict-ruling" class="top-search-input" style="width:100%;border-radius:6px" required>' +
            '<option value="Claim Granted in Full">Claim Granted in Full (In Favor of Plaintiff)</option>' +
            '<option value="Claim Granted in Part">Claim Granted in Part</option>' +
            '<option value="Claim Dismissed">Claim Dismissed / In Favor of Defendant</option>' +
          '</select>' +
        '</div>' +
        '<div style="margin-bottom:0.75rem">' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">2. Legal Grounds &amp; Judgment Decree</label>' +
          '<textarea id="verdict-text" class="top-search-input" style="width:100%;height:80px;border-radius:6px;padding:0.5rem" placeholder="State final legal reasoning pursuant to Federal Civil Procedure Code..." required></textarea>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem">' +
          '<div>' +
            '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">3. Plaintiff Counsel Rating (1-5 ⭐)</label>' +
            '<select id="verdict-plaintiff-score" class="top-search-input" style="width:100%;border-radius:6px">' +
              '<option value="5">⭐⭐⭐⭐⭐ (5.0 - Exceptional)</option>' +
              '<option value="4" selected>⭐⭐⭐⭐ (4.0 - Competent)</option>' +
              '<option value="3">⭐⭐⭐ (3.0 - Satisfactory)</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">4. Defense Counsel Rating (1-5 ⭐)</label>' +
            '<select id="verdict-defense-score" class="top-search-input" style="width:100%;border-radius:6px">' +
              '<option value="5">⭐⭐⭐⭐⭐ (5.0 - Exceptional)</option>' +
              '<option value="4" selected>⭐⭐⭐⭐ (4.0 - Competent)</option>' +
              '<option value="3">⭐⭐⭐ (3.0 - Satisfactory)</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<button type="submit" class="btn-schedule-action" style="width:100%;padding:0.75rem;background:#0b1a30;color:#fff;border:none">⚖️ Issue Final Decree &amp; Dispatch SMS Notices</button>' +
      '</form>' +
    '</div>';

  openJudgeModal();
}
window.openJudgeCaseModal = openJudgeCaseModal;

function switchModalTab(tabKey) {
  const tabs = ['overview', 'evidence', 'notepad', 'verdict'];
  tabs.forEach(t => {
    const el = document.getElementById('modal-tab-' + t);
    const btn = document.getElementById('tab-btn-' + t);
    if (el) el.style.display = (t === tabKey) ? 'block' : 'none';
    if (btn) {
      if (t === tabKey) {
        btn.style.background = '#0b1a30';
        btn.style.color = '#ffffff';
        btn.style.borderColor = '#0b1a30';
        btn.style.fontWeight = '700';
      } else {
        btn.style.background = '#f8fafc';
        btn.style.color = '#475569';
        btn.style.borderColor = '#cbd5e1';
        btn.style.fontWeight = '600';
      }
    }
  });
}
window.switchModalTab = switchModalTab;

function viewEvidenceFile(docName, docPath) {
  if (docPath && docPath !== '#' && !docPath.includes('undefined')) {
    window.open(docPath, '_blank');
  } else {
    alert('Viewing document: ' + docName + '\nFile is securely registered in Supreme Court Evidence Vault.');
  }
}
window.viewEvidenceFile = viewEvidenceFile;

async function toggleEvidenceClassification(caseId, docId, targetStatus) {
  try {
    const res = await fetch(API + '/cases/classify-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        docId,
        classificationStatus: targetStatus,
        judgeName: currentJudge.fullName || 'Hon. Judge'
      })
    });
    if (res.ok) {
      alert('✓ Evidentiary classification updated to: ' + targetStatus.toUpperCase());
      await loadJudgeData();
      openJudgeCaseModal(caseId);
      switchModalTab('evidence');
    }
  } catch (err) {
    alert('Error updating evidence: ' + err.message);
  }
}
window.toggleEvidenceClassification = toggleEvidenceClassification;

async function handleDemandEvidenceSubmit(e, caseId) {
  e.preventDefault();
  const targetParty = document.getElementById('demand-target-party').value;
  const deadline = document.getElementById('demand-deadline').value;
  const demandTitle = document.getElementById('demand-title').value.trim();
  const description = document.getElementById('demand-desc').value.trim();
  const btn = document.getElementById('btn-dispatch-demand');

  if (!demandTitle) {
    alert('Please specify the required evidence title');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Dispatching Judicial Demand Order...';
  }

  try {
    const res = await fetch(API + '/cases/demand-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        demandTitle,
        description,
        targetParty,
        deadline,
        judgeName: currentJudge.fullName || 'Hon. Judge Solomon Desta'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert('✓ Judicial Evidence Demand successfully issued and dispatched to ' + targetParty + '!');
      await loadJudgeData();
      openJudgeCaseModal(caseId);
      switchModalTab('evidence');
    } else {
      alert(data.error || 'Failed to issue evidence demand');
    }
  } catch (err) {
    alert('Error issuing evidence demand: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚖️ Dispatch Judicial Evidence Demand Order';
    }
  }
}
window.handleDemandEvidenceSubmit = handleDemandEvidenceSubmit;

async function saveJudgeNotepad(caseId) {
  const content = document.getElementById('judge-notepad-area').value;
  try {
    const res = await fetch(API + '/cases/' + caseId + '/notepad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judgeId: currentJudge.id,
        judgeName: currentJudge.fullName,
        content
      })
    });
    if (res.ok) {
      alert('✓ Judicial notepad saved persistently.');
      await loadJudgeData();
    }
  } catch (err) {
    alert('Error saving notes: ' + err.message);
  }
}
window.saveJudgeNotepad = saveJudgeNotepad;

async function handleDeliverVerdictSubmit(e, caseId) {
  e.preventDefault();
  const verdictRuling = document.getElementById('verdict-ruling').value;
  const verdictText = document.getElementById('verdict-text').value;
  const plaintiffScore = parseFloat(document.getElementById('verdict-plaintiff-score').value) || 5;
  const defenseScore = parseFloat(document.getElementById('verdict-defense-score').value) || 5;

  try {
    const res = await fetch(API + '/cases/verdict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        judgeId: currentJudge.id,
        judgeName: currentJudge.fullName,
        verdictRuling,
        verdictText,
        advocateRatings: [
          { side: 'plaintiff', score: plaintiffScore },
          { side: 'defense', score: defenseScore }
        ]
      })
    });
    if (res.ok) {
      alert('⚖️ Final verdict decree issued and entered into federal registry. Litigants notified via SMS.');
      closeJudgeModal();
      await loadJudgeData();
    }
  } catch (err) {
    alert('Error delivering verdict: ' + err.message);
  }
}
window.handleDeliverVerdictSubmit = handleDeliverVerdictSubmit;

function openJudgeModal() {
  const b = document.getElementById('universal-judge-modal');
  if (b) b.style.display = 'flex';
}
window.openJudgeModal = openJudgeModal;

function closeJudgeModal() {
  const b = document.getElementById('universal-judge-modal');
  if (b) b.style.display = 'none';
}
window.closeJudgeModal = closeJudgeModal;

function openJudgeEditProfileModal() {
  const menu = document.getElementById('judge-profile-dropdown-menu');
  if (menu) menu.style.display = 'none';

  document.getElementById('judge-modal-title').textContent = 'Edit Presiding Judge Profile';
  document.getElementById('judge-modal-body').innerHTML = 
    '<form onsubmit="handleJudgeEditProfileSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Judicial Name</label>' +
        '<input type="text" id="edit-judge-fullname" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentJudge.fullName || 'Hon. Judge Solomon Desta') + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Official Email</label>' +
          '<input type="email" id="edit-judge-email" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentJudge.email || 'solomon.desta@fsc.gov.et') + '" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Chamber Extension</label>' +
          '<input type="text" id="edit-judge-phone" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentJudge.phone || '+251 11 551 7700 (Ext 404)') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;margin-top:1rem">' +
        '<button type="submit" class="btn-schedule-action" style="flex:1;background:var(--fsc-navy-main);color:#fff;border:none">Save Profile</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.6rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeJudgeModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openJudgeModal();
}
window.openJudgeEditProfileModal = openJudgeEditProfileModal;

function handleJudgeEditProfileSubmit(e) {
  e.preventDefault();
  currentJudge.fullName = document.getElementById('edit-judge-fullname').value.trim();
  currentJudge.email = document.getElementById('edit-judge-email').value.trim();
  currentJudge.phone = document.getElementById('edit-judge-phone').value.trim();

  sessionStorage.setItem('court_user', JSON.stringify(currentJudge));
  updateJudgeHeaderUI();
  alert('Judge profile updated.');
  closeJudgeModal();
  renderJudgeCurrentView();
}
window.handleJudgeEditProfileSubmit = handleJudgeEditProfileSubmit;

function logoutJudge() {
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}
window.logoutJudge = logoutJudge;
