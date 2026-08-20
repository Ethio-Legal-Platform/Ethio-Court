'use strict';

const API = '/api';
let currentOfficial = {
  id: "OFFICER-001",
  username: "officer.tesfaye",
  fullName: "Tesfaye Alemu",
  title: "Branch Official",
  role: "officer",
  branchName: "Federal Supreme Court (Sidist Kilo)",
  email: "tesfaye.screening@courts.gov.et",
  phone: "+251 11 551 7700 (Ext 14)"
};

let currentOfficialView = 'dashboard';
let allCases = [];
let allJudges = [];
let allNotifications = [];

const ICONS = {
  briefcase: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  calendarClock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><circle cx="16" cy="16" r="4"/><path d="M16 14v2l1 1"/></svg>',
  gavel: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/></svg>',
  building: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>',
  checkCircle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'officer' || u.role === 'official' || u.role === 'admin') {
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
      clockEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const dropNameEl = document.getElementById('official-dropdown-fullname');
  if (dropNameEl) dropNameEl.textContent = name;

  const topNameEl = document.getElementById('top-official-name');
  if (topNameEl) topNameEl.textContent = name;
}

function toggleOfficialProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('official-profile-dropdown-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}

function handleOfficialGlobalClick(e) {
  const menu = document.getElementById('official-profile-dropdown-menu');
  const trigger = document.getElementById('official-profile-pill-trigger');
  if (menu && menu.style.display === 'block') {
    if (!menu.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
      menu.style.display = 'none';
    }
  }
}

async function loadOfficialData() {
  try {
    const [casesRes, judgesRes, notifsRes] = await Promise.all([
      fetch(API + '/cases').catch(() => null),
      fetch(API + '/judges').catch(() => null),
      fetch(API + '/notifications').catch(() => null)
    ]);
    if (casesRes && casesRes.ok) allCases = await casesRes.json();
    if (judgesRes && judgesRes.ok) allJudges = await judgesRes.json();
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

  if (currentOfficialView === 'filing_queue') {
    renderFilingQueueView(container);
  } else if (currentOfficialView === 'reviewed_cases') {
    renderReviewedCasesView(container);
  } else {
    renderOfficialDashboard(container);
  }
}

// ── 1. Official Dashboard View ──
function renderOfficialDashboard(container) {
  const pendingScheduling = allCases.filter(c => c.status === 'forwarded_to_branch' || c.status === 'pending_screening' || !c.hearingDate);
  const scheduledCases = allCases.filter(c => c.hearingDate && (c.status === 'scheduled' || c.status === 'assigned' || c.status === 'hearing'));
  const activeJudgesCount = allJudges.length || 4;

  const queueRowsHtml = pendingScheduling.length ? pendingScheduling.slice(0, 6).map(c => {
    const filedDate = c.filingDate ? new Date(c.filingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'Recent';
    const catLabel = c.caseCategory || c.caseType || 'Civil Dispute';

    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openOfficialScheduleModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td>' +
        '<strong style="color:var(--fsc-navy-main)">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong><br>' +
        '<span style="font-size:0.75rem;color:#64748b">Filer: ' + (c.petitioner || 'Litigant') + '</span>' +
      '</td>' +
      '<td><span class="status-pill pill-blue">' + catLabel + '</span></td>' +
      '<td style="color:#64748b">' + filedDate + '</td>' +
      '<td><span class="status-pill pill-orange">AWAITING SCHEDULING</span></td>' +
      '<td>' +
        '<button class="btn-schedule-action" onclick="openOfficialScheduleModal(\'' + c.caseId + '\')">' +
          '📅 Schedule First Hearing' +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem">✓ No cases currently awaiting scheduling.</td></tr>';

  const scheduledRowsHtml = scheduledCases.length ? scheduledCases.slice(0, 6).map(c => {
    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openOfficialScheduleModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td><strong>' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong></td>' +
      '<td style="color:var(--fsc-navy-main);font-weight:700">' + (c.judgeName || 'Hon. Judge Solomon Desta') + '</td>' +
      '<td><span class="status-pill pill-navy">' + (c.courtroom || 'Courtroom 4') + '</span></td>' +
      '<td style="color:#16a34a;font-weight:700">' + (c.hearingDate || '2026-06-05') + ' at ' + (c.hearingTime || '09:30 AM') + '</td>' +
      '<td><span class="status-pill pill-green">SCHEDULED</span></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem">No cases scheduled yet.</td></tr>';

  container.innerHTML = 
    '<div class="official-greeting-row">' +
      '<div>' +
        '<h1 class="official-greeting-title">Welcome back, ' + (currentOfficial.fullName || 'Branch Official') + '</h1>' +
        '<div class="official-greeting-sub">Manage chamber calendar allocations, assign judges, and set courtroom first hearings.</div>' +
      '</div>' +
    '</div>' +

    '<div class="official-kpi-grid-4">' +
      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-orange">' + ICONS.calendarClock + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Pending Scheduling</div>' +
            '<div class="official-kpi-number">' + pendingScheduling.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Forwarded from Admin screening</div>' +
      '</div>' +

      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-green">' + ICONS.checkCircle + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Hearings Scheduled</div>' +
            '<div class="official-kpi-number">' + scheduledCases.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Active courtroom calendar slots</div>' +
      '</div>' +

      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-purple">' + ICONS.gavel + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Active Chambers</div>' +
            '<div class="official-kpi-number">' + activeJudgesCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Available judicial benches</div>' +
      '</div>' +

      '<div class="official-kpi-card">' +
        '<div class="official-kpi-top">' +
          '<div class="official-kpi-icon kpi-blue">' + ICONS.building + '</div>' +
          '<div>' +
            '<div class="official-kpi-label">Branch Courtrooms</div>' +
            '<div class="official-kpi-number">6</div>' +
          '</div>' +
        '</div>' +
        '<div class="official-kpi-delta">Active hearing halls</div>' +
      '</div>' +
    '</div>' +

    '<div class="official-panel-card">' +
      '<div class="official-panel-head">' +
        '<div>' +
          '<div class="official-panel-title">Incoming Cases Requiring First Hearing Scheduling</div>' +
          '<div class="official-panel-sub">Cases forwarded by Admin awaiting judge, courtroom, and calendar allocation.</div>' +
        '</div>' +
        '<button class="btn-view-all-link" onclick="switchOfficialView(\'filing_queue\')">View Full Queue &rarr;</button>' +
      '</div>' +
      '<table class="official-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Case Title / Parties</th>' +
            '<th>Category</th>' +
            '<th>Filed Date</th>' +
            '<th>Status</th>' +
            '<th>Actions</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + queueRowsHtml + '</tbody>' +
      '</table>' +
    '</div>' +

    '<div class="official-panel-card">' +
      '<div class="official-panel-head">' +
        '<div>' +
          '<div class="official-panel-title">Recently Scheduled First Hearings</div>' +
          '<div class="official-panel-sub">Active summons dispatched to litigants and counsel.</div>' +
        '</div>' +
        '<button class="btn-view-all-link" onclick="switchOfficialView(\'reviewed_cases\')">View All Scheduled &rarr;</button>' +
      '</div>' +
      '<table class="official-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Title</th>' +
            '<th>Assigned Judge</th>' +
            '<th>Courtroom</th>' +
            '<th>Hearing Date &amp; Time</th>' +
            '<th>Status</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + scheduledRowsHtml + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 2. Filing Queue View ──
function renderFilingQueueView(container) {
  const pendingScheduling = allCases.filter(c => c.status === 'forwarded_to_branch' || c.status === 'pending_screening' || !c.hearingDate);

  const rowsHtml = pendingScheduling.length ? pendingScheduling.map(c => {
    const filedDate = c.filingDate ? new Date(c.filingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent';
    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openOfficialScheduleModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td>' +
        '<strong style="color:var(--fsc-navy-main)">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong><br>' +
        '<span style="font-size:0.75rem;color:#64748b">Filer: ' + (c.petitioner || 'Litigant') + ' (' + (c.filerPhone || 'No Phone') + ')</span>' +
      '</td>' +
      '<td><span class="status-pill pill-blue">' + (c.caseCategory || c.caseType || 'Civil Dispute') + '</span></td>' +
      '<td>' + (c.jurisdiction || 'Federal Supreme Court') + '</td>' +
      '<td style="color:#64748b">' + filedDate + '</td>' +
      '<td>' +
        '<button class="btn-schedule-action" onclick="openOfficialScheduleModal(\'' + c.caseId + '\')">' +
          '📅 Schedule First Hearing' +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2.5rem">✓ All incoming filings have been scheduled!</td></tr>';

  container.innerHTML = 
    '<div class="official-greeting-row">' +
      '<div>' +
        '<h1 class="official-greeting-title">Branch Intake &amp; Hearing Scheduling Queue</h1>' +
        '<div class="official-greeting-sub">Assign presiding judges, courtroom slots, and court clerks for first hearings.</div>' +
      '</div>' +
    '</div>' +
    '<div class="official-panel-card">' +
      '<table class="official-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Case Title / Parties</th>' +
            '<th>Category</th>' +
            '<th>Court Branch</th>' +
            '<th>Forwarded Date</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 3. Reviewed & Scheduled Cases View ──
function renderReviewedCasesView(container) {
  const scheduledCases = allCases.filter(c => c.hearingDate || c.status === 'scheduled' || c.status === 'hearing' || c.status === 'Decided');

  const rowsHtml = scheduledCases.length ? scheduledCases.map(c => {
    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openOfficialScheduleModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td><strong>' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong></td>' +
      '<td style="color:var(--fsc-navy-main);font-weight:700">' + (c.judgeName || 'Hon. Judge Solomon Desta') + '</td>' +
      '<td><span class="status-pill pill-navy">' + (c.courtroom || 'Courtroom 4') + '</span></td>' +
      '<td>' + (c.clerkName || 'Kalkidan Mengistu') + '</td>' +
      '<td style="color:#16a34a;font-weight:700">' + (c.hearingDate || '2026-06-05') + ' ' + (c.hearingTime || '09:30 AM') + '</td>' +
      '<td><span class="status-pill pill-green">' + (c.status || 'SCHEDULED').toUpperCase() + '</span></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:2rem">No cases scheduled yet.</td></tr>';

  container.innerHTML = 
    '<div class="official-greeting-row">' +
      '<div>' +
        '<h1 class="official-greeting-title">Scheduled Court Hearings Directory</h1>' +
        '<div class="official-greeting-sub">Master roster of all scheduled first hearings across branch courtrooms.</div>' +
      '</div>' +
    '</div>' +
    '<div class="official-panel-card">' +
      '<table class="official-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Title</th>' +
            '<th>Presiding Judge</th>' +
            '<th>Courtroom</th>' +
            '<th>Assigned Clerk</th>' +
            '<th>Hearing Date &amp; Time</th>' +
            '<th>Status</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 4. Interactive First Hearing Scheduling Modal (Section 5) ──

// ── Real-Time Availability Check & First Hearing Scheduling (Section 5) ──
async function onOfficialDateSelected(dateVal) {
  const statusNote = document.getElementById('off-sched-avail-status');
  const judgeSelect = document.getElementById('sched-judge');
  const lawyerSelect = document.getElementById('sched-lawyer');
  const submitBtn = document.getElementById('off-sched-submit-btn');

  if (!dateVal) {
    if (statusNote) statusNote.innerHTML = '<span style="color:#64748b">Please select a hearing date first to verify chamber and advocate availability.</span>';
    if (judgeSelect) judgeSelect.disabled = true;
    if (lawyerSelect) lawyerSelect.disabled = true;
    return;
  }

  if (statusNote) statusNote.innerHTML = '<span style="color:#0284c7">Querying judge chamber rosters and advocate calendars for ' + dateVal + '...</span>';

  try {
    const res = await fetch(API + '/availability?date=' + dateVal);
    if (!res.ok) throw new Error('Failed to fetch availability');
    const data = await res.json();

    if (judgeSelect) {
      judgeSelect.disabled = false;
      const judges = data.judges || [];
      judgeSelect.innerHTML = '<option value="" disabled selected>-- Select an Available Presiding Judge --</option>' +
        judges.map(j => {
          if (j.isAvailable) {
            return '<option value="' + j.fullName + '|' + j.id + '">' + j.fullName + ' — ' + j.statusText + '</option>';
          } else {
            return '<option value="' + j.fullName + '|' + j.id + '" disabled style="color:#94a3b8;background:#f1f5f9">✕ ' + j.fullName + ' — ' + j.statusText + '</option>';
          }
        }).join('');
    }

    if (lawyerSelect) {
      lawyerSelect.disabled = false;
      const lawyers = data.lawyers || [];
      lawyerSelect.innerHTML = '<option value="" selected>-- No Advocate Assigned / Self-Represented --</option>' +
        lawyers.map(l => {
          if (l.isAvailable) {
            return '<option value="' + l.licenseNumber + '|' + l.fullName + '">' + l.fullName + ' (' + l.licenseNumber + ') — ' + (l.isGovernmentLawyer ? 'Public Defender · ' : '') + 'Available</option>';
          } else {
            return '<option value="' + l.licenseNumber + '|' + l.fullName + '" disabled style="color:#94a3b8;background:#f1f5f9">✕ ' + l.fullName + ' (' + l.licenseNumber + ') — ' + l.statusText + '</option>';
          }
        }).join('');
    }

    const availableJudgesCount = (data.judges || []).filter(j => j.isAvailable).length;
    const availableLawyersCount = (data.lawyers || []).filter(l => l.isAvailable).length;

    if (statusNote) {
      statusNote.innerHTML = '<span style="color:#16a34a;font-weight:700">✓ Calendars Verified for ' + dateVal + ':</span> ' +
        '<span style="color:#334155">' + availableJudgesCount + ' Judges Available · ' + availableLawyersCount + ' Lawyers Free</span>';
    }

    if (submitBtn) submitBtn.disabled = false;
  } catch (e) {
    if (statusNote) statusNote.innerHTML = '<span style="color:#dc2626">Error: ' + e.message + '</span>';
  }
}

function openOfficialScheduleModal(caseId) {
  const caseItem = allCases.find(c => c.caseId === caseId) || { caseId, petitioner: 'Filer', respondent: 'Respondent', caseTitle: 'Court Case' };

  document.getElementById('official-modal-title').textContent = 'First Hearing & Chamber Allocation — ' + caseId;
  document.getElementById('official-modal-body').innerHTML = 
    '<form onsubmit="handleOfficialScheduleSubmit(event, \'' + caseId + '\')">' +
      '<div style="background:#f8fafc;padding:0.75rem 1rem;border-radius:6px;margin-bottom:1rem;border:1px solid #e2e8f0">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:1rem">' + (caseItem.caseTitle || caseItem.petitioner + ' vs. ' + caseItem.respondent) + '</div>' +
        '<div style="font-size:0.775rem;color:#64748b;margin-top:2px">Case ID: <strong>' + caseItem.caseId + '</strong> | Filer: ' + (caseItem.petitioner || 'Plaintiff') + ' | Branch: ' + (caseItem.jurisdiction || 'Federal Supreme Court') + '</div>' +
      '</div>' +

      '<!-- Step 1: Date First -->' +
      '<div style="background:#f0f9ff;padding:0.85rem 1rem;border-radius:8px;border:1.5px solid #bae6fd;margin-bottom:1rem">' +
        '<label style="font-weight:800;color:#0369a1;display:block;margin-bottom:0.35rem;font-size:0.85rem">' +
          '📅 Step 1: Select First Hearing Date (Enables Chamber & Advocate Availability Verification)' +
        '</label>' +
        '<input type="date" id="sched-date" class="top-search-input" style="width:100%;border-radius:6px;background:#ffffff;font-weight:700;color:var(--fsc-navy-main)" onchange="onOfficialDateSelected(this.value)" required/>' +
        '<div id="off-sched-avail-status" style="margin-top:0.4rem;font-size:0.75rem;font-weight:600">' +
          '<span style="color:#64748b">Select a date above to verify free/busy chamber and lawyer slots.</span>' +
        '</div>' +
      '</div>' +

      '<!-- Step 2: Presiding Judge -->' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">⚖️ Step 2: Choose Presiding Judge (Only Available Benches Enabled)</label>' +
        '<select id="sched-judge" class="top-search-input" style="width:100%;border-radius:6px;background:#ffffff" disabled required>' +
          '<option value="" disabled selected>-- Select a hearing date first --</option>' +
        '</select>' +
      '</div>' +

      '<!-- Step 3: Assigned Lawyer -->' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">👥 Step 3: Choose Appearing / State Advocate (Only Conflict-Free Counsel Enabled)</label>' +
        '<select id="sched-lawyer" class="top-search-input" style="width:100%;border-radius:6px;background:#ffffff" disabled>' +
          '<option value="" disabled selected>-- Select a hearing date first --</option>' +
        '</select>' +
      '</div>' +

      '<!-- Step 4: Courtroom & Time -->' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">🏛️ Courtroom</label>' +
          '<select id="sched-courtroom" class="top-search-input" style="width:100%;border-radius:6px" required>' +
            '<option value="Courtroom 1A (Cassation Bench)">Courtroom 1A (Cassation Bench)</option>' +
            '<option value="Courtroom 1B (Appellate Bench)">Courtroom 1B (Appellate Bench)</option>' +
            '<option value="Courtroom 2A (Commercial Division)">Courtroom 2A (Commercial Division)</option>' +
            '<option value="Courtroom 4 (Main Trial Room)" selected>Courtroom 4 (Main Trial Room)</option>' +
          '</select>' +
        '</div>' +

        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">⏰ Session Time Slot (Sub-Hour Granularity)</label>' +
          '<select id="sched-time" class="top-search-input" style="width:100%;border-radius:6px" required>' +
            '<option value="09:00 AM">09:00 AM - 10:00 AM</option>' +
            '<option value="09:30 AM" selected>09:30 AM - 10:30 AM</option>' +
            '<option value="10:30 AM">10:30 AM - 11:30 AM</option>' +
            '<option value="11:15 AM">11:15 AM - 12:15 PM</option>' +
            '<option value="02:00 PM">02:00 PM - 03:00 PM</option>' +
            '<option value="03:30 PM">03:30 PM - 04:30 PM</option>' +
          '</select>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">📋 Assigned Court Clerk</label>' +
          '<select id="sched-clerk" class="top-search-input" style="width:100%;border-radius:6px">' +
            '<option value="Kalkidan Mengistu" selected>Kalkidan Mengistu (Senior Registrar)</option>' +
            '<option value="Yared Bekele">Yared Bekele (Chamber Clerk)</option>' +
          '</select>' +
        '</div>' +

        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">⏱️ Estimated Duration</label>' +
          '<input type="text" id="sched-duration" class="top-search-input" style="width:100%;border-radius:6px" value="1 hour" required/>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" id="off-sched-submit-btn" class="btn-schedule-action" style="flex:1;padding:0.75rem;font-size:0.85rem;justify-content:center" disabled>Confirm &amp; Dispatch Summons</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeOfficialModal()">Cancel</button>' +
      '</div>' +
    '</form>';

  openOfficialModal();
}


async function handleOfficialScheduleSubmit(e, caseId) {
  e.preventDefault();
  const judgeRaw = document.getElementById('sched-judge').value.split('|');
  const judgeName = judgeRaw[0];
  const judgeId = judgeRaw[1];
  const courtroom = document.getElementById('sched-courtroom').value;
  const hearingDate = document.getElementById('sched-date').value;
  const hearingTime = document.getElementById('sched-time').value;
  const clerkName = document.getElementById('sched-clerk').value;
  const estimatedDuration = document.getElementById('sched-duration').value;

  try {
    const res = await fetch(API + '/cases/schedule-hearing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        judgeId,
        judgeName,
        courtroom,
        hearingDate,
        hearingTime,
        clerkName,
        estimatedDuration,
        officialName: currentOfficial.fullName || 'Branch Official'
      })
    });
    if (res.ok) {
      alert('✓ First hearing scheduled successfully. Summons dispatched to parties.');
      closeOfficialModal();
      await loadOfficialData();
    }
  } catch (err) {
    alert('Error scheduling hearing: ' + err.message);
  }
}

function openOfficialModal() {
  const b = document.getElementById('official-modal-backdrop');
  if (b) b.style.display = 'flex';
}

function closeOfficialModal() {
  const b = document.getElementById('official-modal-backdrop');
  if (b) b.style.display = 'none';
}

function openOfficialEditProfileModal() {
  const menu = document.getElementById('official-profile-dropdown-menu');
  if (menu) menu.style.display = 'none';

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
      '<div style="display:flex;gap:0.5rem;margin-top:1rem">' +
        '<button type="submit" class="btn-schedule-action" style="flex:1">Save Changes</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.6rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeOfficialModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openOfficialModal();
}

function handleOfficialEditProfileSubmit(e) {
  e.preventDefault();
  currentOfficial.fullName = document.getElementById('edit-off-fullname').value.trim();
  currentOfficial.email = document.getElementById('edit-off-email').value.trim();
  currentOfficial.phone = document.getElementById('edit-off-phone').value.trim();

  sessionStorage.setItem('court_user', JSON.stringify(currentOfficial));
  updateOfficialHeaderUI();
  alert('Officer profile updated.');
  closeOfficialModal();
  renderOfficialCurrentView();
}

function logoutOfficial() {
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}
