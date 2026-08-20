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

  const topNameEl = document.getElementById('top-judge-name');
  if (topNameEl) topNameEl.textContent = name;
  
  const initialsEl = document.getElementById('judge-avatar-initials');
  if (initialsEl) initialsEl.textContent = initials;

  const dropNameEl = document.getElementById('judge-dropdown-fullname');
  if (dropNameEl) dropNameEl.textContent = name;
}

function toggleJudgeProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('judge-profile-dropdown-menu');
  if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function handleJudgeGlobalClick(e) {
  const menu = document.getElementById('judge-profile-dropdown-menu');
  const trigger = document.getElementById('judge-profile-pill-trigger');
  if (menu && menu.style.display === 'block') {
    if (!menu.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
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

// ── 4. Full Judicial Docket Modal (Sections 3, 7, 10, 11, 12) ──
function openJudgeCaseModal(caseId) {
  const c = allCourtCases.find(it => it.caseId === caseId) || { caseId, petitioner: 'Plaintiff', respondent: 'Defendant', caseTitle: 'Judicial Docket' };
  const docs = c.documents || [];
  const noteContent = c.judgeNotepad || '';

  const docsHtml = docs.length ? docs.map(d => {
    const isSealed = d.classificationStatus === 'sealed';
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.75rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:0.4rem">' +
      '<div>' +
        '<strong style="font-size:0.8rem;color:var(--fsc-navy-main)">📄 ' + d.name + '</strong>' +
        '<div style="font-size:0.7rem;color:#64748b">' + (d.size || '1.2 MB') + ' | Status: <span style="font-weight:700;color:' + (isSealed ? '#dc2626' : '#16a34a') + '">' + (d.classificationStatus || 'Shared').toUpperCase() + '</span></div>' +
      '</div>' +
      '<div style="display:flex;gap:0.35rem">' +
        '<button type="button" class="btn-open-case" style="font-size:0.7rem;padding:0.25rem 0.5rem" onclick="toggleEvidenceClassification(\'' + c.caseId + '\', \'' + d.id + '\', \'' + (isSealed ? 'shared' : 'sealed') + '\')">' +
          (isSealed ? '🔓 Share with Defense' : '🔒 Seal Document') +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('') : '<p style="color:#64748b;font-size:0.8rem">No evidentiary documents submitted.</p>';

  document.getElementById('judge-modal-title').textContent = 'Chamber Docket — ' + c.caseId;
  document.getElementById('judge-modal-body').innerHTML = 
    '<!-- Tabs -->' +
    '<div style="display:flex;gap:0.5rem;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:1rem">' +
      '<button type="button" id="tab-btn-overview" class="btn-view-all-link" style="background:#0b1a30;color:#fff" onclick="switchModalTab(\'overview\')">Overview &amp; Parties</button>' +
      '<button type="button" id="tab-btn-evidence" class="btn-view-all-link" onclick="switchModalTab(\'evidence\')">Evidence Gate (' + docs.length + ')</button>' +
      '<button type="button" id="tab-btn-notepad" class="btn-view-all-link" onclick="switchModalTab(\'notepad\')">Judge Notepad</button>' +
      '<button type="button" id="tab-btn-verdict" class="btn-view-all-link" onclick="switchModalTab(\'verdict\')">Deliver Verdict &amp; Rating</button>' +
    '</div>' +

    '<!-- Tab 1: Overview -->' +
    '<div id="modal-tab-overview">' +
      '<div style="background:#f8fafc;padding:0.75rem 1rem;border-radius:6px;margin-bottom:0.75rem;border:1px solid #e2e8f0">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:1rem">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</div>' +
        '<div style="font-size:0.75rem;color:#64748b;margin-top:2px">Case Category: <strong>' + (c.caseCategory || c.caseType || 'Civil Dispute') + '</strong> | Branch: ' + (c.jurisdiction || 'Federal Supreme Court') + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div style="padding:0.75rem;border:1px solid #e2e8f0;border-radius:6px">' +
          '<div style="font-weight:700;color:var(--fsc-navy-main);font-size:0.8rem">Plaintiff / Filer</div>' +
          '<div style="font-size:0.75rem;color:#334155;margin-top:2px">' + (c.petitioner || 'Plaintiff') + '</div>' +
          '<div style="font-size:0.7rem;color:#64748b">Counsel: ' + (c.lawyerAppointed ? c.lawyerAppointed.fullName : (c.plaintiffLawyerName || 'Self-Represented')) + '</div>' +
        '</div>' +
        '<div style="padding:0.75rem;border:1px solid #e2e8f0;border-radius:6px">' +
          '<div style="font-weight:700;color:var(--fsc-navy-main);font-size:0.8rem">Defendant</div>' +
          '<div style="font-size:0.75rem;color:#334155;margin-top:2px">' + (c.respondent || 'Defendant') + '</div>' +
          '<div style="font-size:0.7rem;color:#64748b">Counsel: ' + (c.defendantRepresentation ? (c.defendantRepresentation.type + ' (' + (c.defendantRepresentation.lawyerName || 'Assigned') + ')') : 'Awaiting Choice') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:0.75rem;background:#f0f9ff;border-radius:6px;border:1px solid #bae6fd;font-size:0.75rem;color:#0369a1">' +
        '<strong>Scheduled Hearing:</strong> ' + (c.hearingDate || 'TBD') + ' at ' + (c.hearingTime || '09:30 AM') + ' | ' + (c.courtroom || 'Courtroom 4') + ' | Clerk: ' + (c.clerkName || 'Kalkidan Mengistu') +
      '</div>' +
    '</div>' +

    '<!-- Tab 2: Evidence -->' +
    '<div id="modal-tab-evidence" style="display:none">' +
      '<div style="margin-bottom:0.75rem;font-size:0.775rem;color:#64748b">Judge 2-Stage Evidentiary Gate (Section 3): Review and seal sensitive evidentiary records.</div>' +
      docsHtml +
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

function switchModalTab(tabKey) {
  ['overview', 'evidence', 'notepad', 'verdict'].forEach(t => {
    const el = document.getElementById('modal-tab-' + t);
    const btn = document.getElementById('tab-btn-' + t);
    if (el) el.style.display = t === tabKey ? 'block' : 'none';
    if (btn) {
      if (t === tabKey) {
        btn.style.background = '#0b1a30';
        btn.style.color = '#ffffff';
      } else {
        btn.style.background = '#f8fafc';
        btn.style.color = 'var(--fsc-navy-main)';
      }
    }
  });
}

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

function openJudgeModal() {
  const b = document.getElementById('universal-judge-modal');
  if (b) b.style.display = 'flex';
}

function closeJudgeModal() {
  const b = document.getElementById('universal-judge-modal');
  if (b) b.style.display = 'none';
}

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

function logoutJudge() {
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}
