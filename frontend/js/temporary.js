// ──────────────────────────────────────────────────────────
// Federal Supreme Court of Ethiopia — Litigant Portal System
// Dedicated Multi-Account Workspace for Plaintiffs & Defendants
// ──────────────────────────────────────────────────────────

const API = '/api';
let currentLitigant = null;
let myCases = [];
let allLawyers = [];
let activeView = 'dashboard';

// Clean phone helper
function cleanPhone(p) {
  if (!p) return '';
  return p.toString().replace(/[^0-9]/g, '').slice(-9);
}

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', async () => {
  const sessionUser = sessionStorage.getItem('court_user');
  if (sessionUser) {
    try {
      currentLitigant = JSON.parse(sessionUser);
    } catch (e) {
      console.error('Failed to parse session user:', e);
    }
  }

  // Fallback if not logged in
  if (!currentLitigant) {
    currentLitigant = {
      id: 'TEMP-ADNAN',
      username: '0944430222',
      phone: '0944430222',
      fullName: 'Adnan',
      role: 'client',
      side: 'plaintiff',
      accountType: 'Plaintiff / Case Filer',
      caseId: 'CASE-1787286146761',
      trackingCode: 'ET-FSC-837221',
      email: 'qalalewtere@gmail.com',
      appointedLawyer: {
        id: 'LAWYER-002',
        fullName: 'Advocate Tigist Assefa',
        licenseNumber: 'LAW-1002',
        chamber: 'Federal Supreme Court Bar',
        status: 'active'
      }
    };
  }

  updateLitigantHeaderUI();
  await loadLitigantData();
  startAccessCountdown();
});

// ── HEADER & PROFILE UI ──
function updateLitigantHeaderUI() {
  if (!currentLitigant) return;

  const topName = document.getElementById('top-litigant-name');
  const topRole = document.getElementById('top-litigant-role');
  const avatar = document.getElementById('litigant-avatar-initials');
  const dropAvatar = document.getElementById('litigant-dropdown-avatar');
  const dropName = document.getElementById('litigant-dropdown-fullname');
  const dropSub = document.getElementById('litigant-dropdown-sub');

  const fullName = currentLitigant.fullName || (currentLitigant.role === 'defendant' ? 'Dagim' : 'Adnan');
  const accountType = currentLitigant.accountType || (currentLitigant.role === 'defendant' ? 'Defendant / Accused Party' : 'Plaintiff / Case Filer');

  // Compute initials
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'LT';

  if (topName) topName.textContent = fullName;
  if (topRole) topRole.textContent = accountType;
  if (avatar) avatar.textContent = initials;
  if (dropAvatar) dropAvatar.textContent = initials;
  if (dropName) dropName.textContent = fullName;
  if (dropSub) dropSub.textContent = accountType + ' · ' + (currentLitigant.phone || 'Verified');
}

// ── DATA LOADING ──
async function loadLitigantData() {
  try {
    const [casesRes, lawyersRes] = await Promise.all([
      fetch(API + '/cases'),
      fetch(API + '/lawyers')
    ]);

    if (casesRes.ok) {
      const allCases = await casesRes.json();
      const userPhone = cleanPhone(currentLitigant.phone || currentLitigant.username);
      const userCaseId = currentLitigant.caseId;

      // Filter cases belonging to this specific litigant
      myCases = allCases.filter(c => {
        if (userCaseId && c.caseId === userCaseId) return true;
        const filerP = cleanPhone(c.filerPhone || c.phone || (c.filer && c.filer.phone));
        const defP = cleanPhone(c.defendantPhone || (c.defendant && c.defendant.phone));
        return (userPhone && (filerP === userPhone || defP === userPhone));
      });

      if (myCases.length === 0 && allCases.length > 0) {
        myCases = [allCases[0]];
      }
    }

    if (lawyersRes.ok) {
      allLawyers = await lawyersRes.json();
    }
  } catch (err) {
    console.error('Error fetching litigant data:', err);
  }

  renderCurrentView();
}

function getMyCase() {
  if (myCases && myCases.length > 0) return myCases[0];
  return {
    caseId: currentLitigant.caseId || 'CASE-1787286146761',
    trackingCode: currentLitigant.trackingCode || 'ET-FSC-837221',
    caseTitle: 'Criminal Proceedings',
    courtLevel: 'Federal Supreme Court (Sidist Kilo)',
    status: 'scheduled',
    incidentDate: '2026-08-21',
    petitioner: 'Adnan',
    respondent: 'Dagim',
    defendantName: 'Dagim',
    judgeName: 'Hon. Judge Solomon Desta',
    courtroom: 'Courtroom 4 (Main Trial Room)',
    hearingDate: '2026-08-21',
    hearingTime: '09:30 AM',
    documents: [],
    timeline: []
  };
}

// ── NAVIGATION & VIEW SWITCHING ──
function switchLitigantView(viewName) {
  activeView = (viewName === 'my_cases' || viewName === 'my_case') ? 'my_case' : viewName;
  document.querySelectorAll('.litigant-nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector('[data-view="' + activeView + '"]') || document.querySelector('button[onclick*="' + viewName + '"]');
  if (activeBtn) activeBtn.classList.add('active');
  renderCurrentView();
}
window.switchLitigantView = switchLitigantView;

function getWorkspaceContainer() {
  return document.getElementById('dynamic-litigant-workspace') || document.getElementById('litigant-workspace-view');
}

function renderCurrentView() {
  const container = getWorkspaceContainer();
  if (!container) return;

  if (activeView === 'dashboard') {
    renderLitigantDashboard();
  } else if (activeView === 'my_case') {
    renderCaseDetailsView();
  } else if (activeView === 'hearings') {
    renderHearingsScheduleView();
  } else if (activeView === 'documents') {
    renderDocumentsView();
  } else if (activeView === 'summons') {
    renderSummonsNoticeView();
  } else if (activeView === 'messages') {
    renderMessagesView();
  } else {
    renderLitigantDashboard();
  }
}

// ── DASHBOARD VIEW ──
function renderLitigantDashboard() {
  const container = getWorkspaceContainer();
  if (!container) return;

  const myCase = getMyCase();
  const isDef = currentLitigant.role === 'defendant' || currentLitigant.side === 'defendant';
  const lawyer = currentLitigant.appointedLawyer;

  let repCardHtml = '';
  if (lawyer) {
    repCardHtml = 
      '<div class="rep-glance-body" style="padding:0.75rem 0">' +
        '<div style="font-size:1.05rem;font-weight:800;color:var(--fsc-navy-main);margin-bottom:0.25rem">' + lawyer.fullName + '</div>' +
        '<div style="font-size:0.8rem;color:#475569;margin-bottom:0.65rem">' +
          'Advocate License: <strong style="color:var(--fsc-navy-main)">' + (lawyer.licenseNumber || 'Verified') + '</strong>' +
        '</div>' +
        '<span class="status-pill pill-green">ACTIVE REPRESENTATION</span>' +
      '</div>';
  } else {
    repCardHtml = 
      '<div class="rep-glance-body" style="padding:0.75rem 0">' +
        '<div style="font-size:0.95rem;font-weight:800;color:#64748b;margin-bottom:0.25rem">Self-Represented</div>' +
        '<div style="font-size:0.785rem;color:#94a3b8;margin-bottom:0.65rem">No advocate appointed for this case</div>' +
        '<span class="status-pill pill-slate">IN PERSON</span>' +
      '</div>';
  }

  container.innerHTML = 
    '<div class="litigant-greeting-row" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">' +
      '<div>' +
        '<h1 class="litigant-greeting-title" style="font-size:1.45rem;font-weight:800;color:var(--fsc-navy-main)">Welcome, ' + (currentLitigant.fullName || 'Litigant') + '</h1>' +
        '<p class="litigant-greeting-sub" style="font-size:0.85rem;color:#64748b;margin-top:0.25rem">Real-time ' + (isDef ? 'defense docket access, court summons, charges,' : 'case tracking, court summons,') + ' and legal representation portal.</p>' +
      '</div>' +
      '<div style="display:flex;gap:0.75rem">' +
        '<button class="btn btn-outline" style="border:1.5px solid var(--fsc-navy-main);color:var(--fsc-navy-main);font-weight:700;padding:0.6rem 1.15rem;border-radius:6px;cursor:pointer" onclick="openAdvocateProfileModal()">' +
          (lawyer ? '⚖️ Representation Details' : '⚖️ Appoint Advocate') +
        '</button>' +
        '<button class="btn btn-primary" style="background:var(--fsc-navy-main);color:#ffffff;font-weight:700;padding:0.6rem 1.15rem;border:none;border-radius:6px;cursor:pointer" onclick="switchLitigantView(\'documents\')">' +
          '📄 Upload Document' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<!-- 3 Metric Glance Cards -->' +
    '<div class="litigant-metrics-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;margin-bottom:1.5rem">' +
      '<!-- Card 1: Case Status -->' +
      '<div class="case-progress-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">' +
          '<span style="font-size:0.725rem;font-weight:800;color:#64748b;letter-spacing:0.06em">CASE DOCKET STATUS</span>' +
          '<div style="width:34px;height:34px;border-radius:50%;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:1.15rem;font-weight:800;color:var(--fsc-navy-main);margin-bottom:0.75rem">' + (myCase.caseId || 'CASE-1787286146761') + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f1f5f9;padding-top:0.65rem">' +
          '<span class="status-pill pill-blue" style="font-size:0.7rem;font-weight:800;text-transform:uppercase;background:#eff6ff;color:#2563eb;padding:0.2rem 0.6rem;border-radius:12px">' + (myCase.status || 'SCHEDULED') + '</span>' +
          '<span style="font-size:0.75rem;color:#64748b;">' + (myCase.courtLevel || 'Federal Supreme Court') + '</span>' +
        '</div>' +
      '</div>' +

      '<!-- Card 2: Legal Representation -->' +
      '<div class="case-progress-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">' +
          '<span style="font-size:0.725rem;font-weight:800;color:#64748b;letter-spacing:0.06em">LEGAL REPRESENTATION</span>' +
          '<div style="width:34px;height:34px;border-radius:50%;background:#f0fdf4;color:#16a34a;display:flex;align-items:center;justify-content:center">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>' +
          '</div>' +
        '</div>' +
        repCardHtml +
        '<div style="margin-top:auto;padding-top:0.65rem;border-top:1px solid #f1f5f9">' +
          '<a href="javascript:void(0)" onclick="openAdvocateProfileModal()" style="font-size:0.785rem;font-weight:700;color:#2563eb;text-decoration:none;">' +
            (lawyer ? 'Manage Representation &rarr;' : 'Appoint Defense Counsel &rarr;') +
          '</a>' +
        '</div>' +
      '</div>' +

      '<!-- Card 3: Next Court Hearing -->' +
      '<div class="case-progress-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">' +
          '<span style="font-size:0.725rem;font-weight:800;color:#64748b;letter-spacing:0.06em">NEXT COURT HEARING</span>' +
          '<div style="width:34px;height:34px;border-radius:50%;background:#fff7ed;color:#ea580c;display:flex;align-items:center;justify-content:center">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>' +
          '</div>' +
        '</div>' +
        '<div style="color:#ea580c;font-size:1.15rem;font-weight:800;margin-bottom:0.75rem">' + (myCase.hearingDate ? myCase.hearingDate + ' (' + (myCase.hearingTime || '09:30 AM') + ')' : 'Scheduled for Hearing') + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f1f5f9;padding-top:0.65rem">' +
          '<span style="font-size:0.785rem;color:#475569;font-weight:600;">' + (myCase.courtroom || 'Courtroom 4') + '</span>' +
          '<span style="font-size:0.75rem;color:#64748b;">' + (myCase.judgeName || 'Hon. Judge Solomon Desta') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- 2 Column Section: Case Details & Quick Actions -->' +
    '<div style="display:grid;grid-template-columns:2fr 1fr;gap:1.25rem">' +
      '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">' +
          '<h3 style="font-size:1rem;font-weight:800;color:var(--fsc-navy-main)">Case Information &amp; Parties</h3>' +
          '<span style="background:#f1f5f9;color:var(--fsc-navy-main);font-size:0.75rem;font-weight:800;padding:0.25rem 0.65rem;border-radius:6px">' + (myCase.trackingCode || 'ET-FSC-837221') + '</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:0.6rem">' +
          '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.825rem"><span style="color:#64748b">Case Title:</span><span style="font-weight:700;color:var(--fsc-navy-main)">' + (myCase.caseTitle || 'Criminal Proceedings') + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.825rem"><span style="color:#64748b">Complainant / Petitioner:</span><span style="font-weight:600">' + (myCase.petitioner || 'Adnan') + (isDef ? '' : ' (You)') + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.825rem"><span style="color:#64748b">Accused / Defendant:</span><span style="font-weight:600">' + (myCase.respondent || myCase.defendantName || 'Dagim') + (isDef ? ' (You)' : '') + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.825rem"><span style="color:#64748b">Filing Date:</span><span>' + (myCase.filingDate ? new Date(myCase.filingDate).toLocaleDateString() : '2026-08-21') + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;font-size:0.825rem"><span style="color:#64748b">Presiding Judge:</span><span>' + (myCase.judgeName || 'Hon. Judge Solomon Desta') + '</span></div>' +
        '</div>' +
        '<div style="margin-top:1.25rem;padding:0.85rem 1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:0.825rem;color:#334155;line-height:1.5">' +
          '<strong style="color:var(--fsc-navy-main)">Case Allegation &amp; Statement:</strong> ' + (myCase.description || 'On 15 August 2026, the complainant reported that the accused allegedly broke into his residence during the night and stole several valuable items...') +
        '</div>' +
      '</div>' +

      '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
        '<h3 style="font-size:1rem;font-weight:800;color:var(--fsc-navy-main);margin-bottom:1rem">Quick Actions</h3>' +
        '<div style="display:flex;flex-direction:column;gap:0.4rem">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.5rem;border-bottom:1px solid #f1f5f9;cursor:pointer;font-size:0.825rem;font-weight:600;color:var(--fsc-navy-main)" onclick="openAdvocateProfileModal()">' +
            '<span>⚖️ ' + (lawyer ? 'View Representation' : 'Appoint Legal Advocate') + '</span>' +
            '<span>&rarr;</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.5rem;border-bottom:1px solid #f1f5f9;cursor:pointer;font-size:0.825rem;font-weight:600;color:var(--fsc-navy-main)" onclick="switchLitigantView(\'documents\')">' +
            '<span>📄 Submit Exhibits</span>' +
            '<span>&rarr;</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.5rem;border-bottom:1px solid #f1f5f9;cursor:pointer;font-size:0.825rem;font-weight:600;color:var(--fsc-navy-main)" onclick="switchLitigantView(\'summons\')">' +
            '<span>📜 Court Summons</span>' +
            '<span>&rarr;</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.5rem;cursor:pointer;font-size:0.825rem;font-weight:600;color:var(--fsc-navy-main)" onclick="switchLitigantView(\'messages\')">' +
            '<span>💬 Registrar Messaging</span>' +
            '<span>&rarr;</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ── REPRESENTATION MODAL ──
function openAdvocateProfileModal() {
  const myCase = getMyCase();
  const caseId = myCase ? myCase.caseId : '';
  const isDef = currentLitigant.role === 'defendant' || currentLitigant.side === 'defendant';
  const lawyer = currentLitigant.appointedLawyer;

  const modalTitle = document.getElementById('litigant-modal-title');
  const modalBody = document.getElementById('litigant-modal-body');
  if (!modalTitle || !modalBody) return;

  modalTitle.textContent = isDef ? 'Defendant Legal Representation & Defense Counsel' : 'Legal Representation & Advocate Appointment';

  if (lawyer) {
    modalBody.innerHTML = 
      '<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:1.25rem;margin-bottom:1.25rem">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">' +
          '<span style="font-weight:800;color:#16a34a;font-size:0.95rem">⚖️ Appointed Legal Advocate</span>' +
          '<span class="status-pill" style="background:#dcfce7;color:#16a34a;font-size:0.75rem;font-weight:800">ACTIVE MANDATE</span>' +
        '</div>' +
        '<div style="font-size:1.2rem;font-weight:800;color:var(--fsc-navy-main);margin-bottom:0.25rem">' + lawyer.fullName + '</div>' +
        '<div style="font-size:0.85rem;color:#334155;margin-bottom:0.25rem">Advocate License Number: <strong>' + (lawyer.licenseNumber || 'LAW-1002') + '</strong></div>' +
        '<div style="font-size:0.775rem;color:#64748b">Chamber: ' + (lawyer.chamber || 'Federal Supreme Court Bar') + '</div>' +
        '<div style="margin-top:0.75rem;padding:0.65rem 0.85rem;background:#ffffff;border:1px solid #dcfce7;border-radius:6px;font-size:0.785rem;color:#166534;line-height:1.45">' +
          '✓ Authorized to submit legal briefs, examine exhibits, and represent you for case <strong>' + caseId + '</strong> before the Federal Supreme Court.' +
        '</div>' +
      '</div>' +

      '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:1.15rem;margin-bottom:1.25rem">' +
        '<div style="font-weight:800;color:#991b1b;font-size:0.9rem;margin-bottom:0.35rem">Revoke Representation &amp; Regain Direct Control</div>' +
        '<div style="font-size:0.785rem;color:#7f1d1d;line-height:1.45;margin-bottom:1rem">' +
          'You may revoke this appointment at any time. Full direct control over docket management and self-representation will return to your account.' +
        '</div>' +
        '<button type="button" class="btn btn-outline" style="background:#dc2626;color:#ffffff;border:none;padding:0.75rem 1.25rem;border-radius:6px;font-weight:700;font-size:0.85rem;width:100%;cursor:pointer" onclick="handleRevokeAppointment()">' +
          '🗑️ Revoke Advocate Appointment' +
        '</button>' +
      '</div>' +

      '<div style="display:flex;justify-content:flex-end">' +
        '<button type="button" class="btn btn-outline" style="padding:0.6rem 1.2rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeLitigantModal()">Close</button>' +
      '</div>';
  } else {
    // Selection form
    const lawyerOptions = (allLawyers && allLawyers.length) ? allLawyers.map(l => 
      '<option value="' + l.licenseNumber + '">' + l.fullName + ' (' + l.licenseNumber + ') — ' + (l.isGovernmentLawyer ? 'Public Defender' : 'Private Bar') + '</option>'
    ).join('') : '<option value="LAW-1002">Advocate Tigist Assefa (LAW-1002)</option><option value="LAW-1001">Kebede Haile Mariam (LAW-1001)</option><option value="LAW-2001">Public Defender Dawit Kebede (LAW-2001)</option>';

    modalBody.innerHTML = 
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.95rem;margin-bottom:0.25rem">' +
          '⚖️ Appoint Legal Representation' +
        '</div>' +
        '<div style="font-size:0.785rem;color:#64748b;margin-bottom:1rem">' +
          'Select or enter a licensed advocate to represent you for Case <strong>' + caseId + '</strong>.' +
        '</div>' +

        '<form onsubmit="handleAppointLawyerSubmit(event)">' +
          '<div style="margin-bottom:0.85rem">' +
            '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.825rem">Advocate License Number</label>' +
            '<div style="display:flex;gap:0.5rem">' +
              '<input type="text" id="rep-advocate-license" class="top-search-input" style="flex:1;text-transform:uppercase;font-weight:700" placeholder="e.g. LAW-1001, LAW-1002, LAW-2001" oninput="handleAdvocateLicenseInput(this.value)" required/>' +
              '<button type="button" class="btn btn-outline" style="padding:0.5rem 0.85rem;border:1px solid #cbd5e1;border-radius:6px;font-weight:600;font-size:0.8rem;cursor:pointer" onclick="verifyAdvocateLicenseManual()">Verify</button>' +
            '</div>' +
            '<div id="advocate-license-feedback" style="margin-top:0.45rem;font-size:0.75rem"></div>' +
          '</div>' +

          '<div style="margin-bottom:0.85rem">' +
            '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.825rem">Or Select from Verified Directory</label>' +
            '<select class="top-search-input" style="width:100%" onchange="document.getElementById(\'rep-advocate-license\').value = this.value; handleAdvocateLicenseInput(this.value);">' +
              '<option value="" selected>-- Pick from FSC Directory --</option>' +
              lawyerOptions +
            '</select>' +
          '</div>' +

          '<div style="display:flex;gap:0.5rem;margin-top:1.15rem">' +
            '<button type="submit" id="appoint-lawyer-btn" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;font-size:0.85rem;cursor:pointer">Confirm Appointment</button>' +
            '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeLitigantModal()">Cancel</button>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  openLitigantModal();
}
window.openAdvocateProfileModal = openAdvocateProfileModal;

async function handleAdvocateLicenseInput(val) {
  const feedback = document.getElementById('advocate-license-feedback');
  if (!feedback) return;
  const cleanLic = (val || '').trim().toUpperCase();
  if (!cleanLic) {
    feedback.innerHTML = '';
    return;
  }

  const local = allLawyers.find(l => (l.licenseNumber && l.licenseNumber.toUpperCase() === cleanLic) || l.id === cleanLic);
  if (local) {
    feedback.innerHTML = 
      '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.45rem 0.65rem;border-radius:6px;margin-top:0.25rem">' +
        '<strong style="color:#16a34a">✓ Verified Advocate:</strong> ' + local.fullName + ' (' + local.licenseNumber + ')<br/>' +
        '<span style="color:#334155;font-size:0.725rem">Chamber: ' + (local.chamberAddress || 'Federal Supreme Court Bar') + '</span>' +
      '</div>';
  } else {
    feedback.innerHTML = '<span style="color:#92400e">ℹ Enter full valid MoJ License Number (e.g. LAW-1001, LAW-1002, LAW-2001).</span>';
  }
}
window.handleAdvocateLicenseInput = handleAdvocateLicenseInput;

function verifyAdvocateLicenseManual() {
  const input = document.getElementById('rep-advocate-license');
  if (input) handleAdvocateLicenseInput(input.value);
}
window.verifyAdvocateLicenseManual = verifyAdvocateLicenseManual;

async function handleAppointLawyerSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('rep-advocate-license');
  const lic = input ? input.value.trim().toUpperCase() : '';
  if (!lic) return;

  const lawyerObj = allLawyers.find(l => (l.licenseNumber && l.licenseNumber.toUpperCase() === lic) || l.id === lic) || {
    id: 'LAWYER-' + Date.now(),
    fullName: 'Advocate ' + lic,
    licenseNumber: lic,
    chamber: 'Federal Supreme Court Bar'
  };

  currentLitigant.appointedLawyer = {
    id: lawyerObj.id,
    fullName: lawyerObj.fullName,
    licenseNumber: lawyerObj.licenseNumber,
    chamber: lawyerObj.chamberAddress || 'Federal Supreme Court Bar',
    status: 'active'
  };

  sessionStorage.setItem('court_user', JSON.stringify(currentLitigant));
  alert('✓ Appointed Advocate ' + lawyerObj.fullName + ' (' + lawyerObj.licenseNumber + ') for your case.');
  closeLitigantModal();
  renderCurrentView();
}
window.handleAppointLawyerSubmit = handleAppointLawyerSubmit;

function handleRevokeAppointment() {
  if (!confirm('Are you sure you want to revoke advocate appointment and resume direct self-representation?')) return;
  currentLitigant.appointedLawyer = null;
  sessionStorage.setItem('court_user', JSON.stringify(currentLitigant));
  alert('✓ Advocate appointment revoked. Full direct control returned.');
  closeLitigantModal();
  renderCurrentView();
}
window.handleRevokeAppointment = handleRevokeAppointment;

// ── MODAL SYSTEM ──
function openLitigantModal() {
  const modal = document.getElementById('universal-litigant-modal') || document.getElementById('litigant-modal-backdrop');
  if (modal) modal.style.display = 'flex';
}
window.openLitigantModal = openLitigantModal;

function closeLitigantModal() {
  const modal = document.getElementById('universal-litigant-modal') || document.getElementById('litigant-modal-backdrop');
  if (modal) modal.style.display = 'none';
}
window.closeLitigantModal = closeLitigantModal;

// ── OTHER MODALS (Appeal, Payment, Case Details, Edit Profile, Change Pin, Help) ──
function openCaseDetailsModal() {
  switchLitigantView('my_case');
}
window.openCaseDetailsModal = openCaseDetailsModal;

function openAppealModal() {
  const modalTitle = document.getElementById('litigant-modal-title');
  const modalBody = document.getElementById('litigant-modal-body');
  if (!modalTitle || !modalBody) return;

  modalTitle.textContent = 'Appellate Review & Notice of Appeal';
  modalBody.innerHTML = 
    '<div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:1rem">' +
      '<div style="font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.35rem">File an Appeal / Cassation Petition</div>' +
      '<div style="font-size:0.8rem;color:#64748b;margin-bottom:0.75rem">Under Cassation Division rules, appeals may be submitted within 30 days of judgment.</div>' +
      '<textarea class="top-search-input" style="width:100%;height:80px;margin-bottom:0.75rem" placeholder="State fundamental error of law or grounds for appellate review..."></textarea>' +
      '<button class="btn btn-primary" style="background:var(--fsc-navy-main);color:#fff;border:none;padding:0.6rem 1.2rem;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Appeal petition submitted to the Appellate Registry for screening.\');closeLitigantModal();">Submit Appeal Notice</button>' +
    '</div>';
  openLitigantModal();
}
window.openAppealModal = openAppealModal;

function openPaymentModal() {
  const modalTitle = document.getElementById('litigant-modal-title');
  const modalBody = document.getElementById('litigant-modal-body');
  if (!modalTitle || !modalBody) return;

  modalTitle.textContent = 'Court Fees & Registry Payments';
  modalBody.innerHTML = 
    '<div style="padding:1rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:1rem">' +
      '<div style="font-weight:700;color:#16a34a;margin-bottom:0.35rem">Payment Status: Up to Date</div>' +
      '<div style="font-size:0.825rem;color:#334155">Filing fee for case <strong>' + (getMyCase().caseId || 'CASE-1787286146761') + '</strong> has been fully settled.</div>' +
      '<div style="font-size:0.75rem;color:#64748b;margin-top:0.35rem">Telebirr Reference: ET-PAY-8839219 &bull; Amount: 250 ETB</div>' +
    '</div>';
  openLitigantModal();
}
window.openPaymentModal = openPaymentModal;

function openLitigantEditProfileModal() {
  const modalTitle = document.getElementById('litigant-modal-title');
  const modalBody = document.getElementById('litigant-modal-body');
  if (!modalTitle || !modalBody) return;

  modalTitle.textContent = 'Litigant Account Information';
  modalBody.innerHTML = 
    '<div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">' +
      '<div style="margin-bottom:0.75rem"><label style="font-size:0.785rem;font-weight:700;color:#64748b;display:block">Full Name</label><input type="text" class="top-search-input" value="' + (currentLitigant.fullName || '') + '" disabled/></div>' +
      '<div style="margin-bottom:0.75rem"><label style="font-size:0.785rem;font-weight:700;color:#64748b;display:block">Registered Phone</label><input type="text" class="top-search-input" value="' + (currentLitigant.phone || '') + '" disabled/></div>' +
      '<div style="margin-bottom:0.75rem"><label style="font-size:0.785rem;font-weight:700;color:#64748b;display:block">Email</label><input type="text" class="top-search-input" value="' + (currentLitigant.email || '') + '" disabled/></div>' +
    '</div>';
  openLitigantModal();
}
window.openLitigantEditProfileModal = openLitigantEditProfileModal;

function openChangePinModal() {
  const modalTitle = document.getElementById('litigant-modal-title');
  const modalBody = document.getElementById('litigant-modal-body');
  if (!modalTitle || !modalBody) return;

  modalTitle.textContent = 'Change Access PIN';
  modalBody.innerHTML = 
    '<div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">' +
      '<div style="margin-bottom:0.75rem"><label style="font-size:0.785rem;font-weight:700;display:block">Current PIN</label><input type="password" class="top-search-input" placeholder="Enter current PIN" required/></div>' +
      '<div style="margin-bottom:0.75rem"><label style="font-size:0.785rem;font-weight:700;display:block">New 6-Digit PIN</label><input type="password" class="top-search-input" placeholder="Enter new 6-digit PIN" required/></div>' +
      '<button class="btn btn-primary" style="background:var(--fsc-navy-main);color:#fff;border:none;padding:0.6rem 1.2rem;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'PIN successfully updated!\');closeLitigantModal();">Update PIN</button>' +
    '</div>';
  openLitigantModal();
}
window.openChangePinModal = openChangePinModal;

function openLitigantHelpModal() {
  const modalTitle = document.getElementById('litigant-modal-title');
  const modalBody = document.getElementById('litigant-modal-body');
  if (!modalTitle || !modalBody) return;

  modalTitle.textContent = 'Federal Supreme Court Help & Assistance';
  modalBody.innerHTML = 
    '<div style="padding:1rem;line-height:1.6;font-size:0.85rem;color:#334155">' +
      '<p style="margin-bottom:0.75rem">For technical assistance, hearing inquiries, or physical filing guidance, please contact the Registrar Registry Office:</p>' +
      '<div><strong>Helpline:</strong> +251 11 551 7700</div>' +
      '<div><strong>Email:</strong> info@fsc.gov.et</div>' +
      '<div><strong>Address:</strong> Churchill Avenue, Sidist Kilo, Addis Ababa</div>' +
    '</div>';
  openLitigantModal();
}
window.openLitigantHelpModal = openLitigantHelpModal;

// ── OTHER VIEWS (Case Details, Hearings, Documents, Summons, Messages) ──
function renderCaseDetailsView() {
  const container = getWorkspaceContainer();
  if (!container) return;
  const myCase = getMyCase();
  const isDef = currentLitigant.role === 'defendant' || currentLitigant.side === 'defendant';

  container.innerHTML = 
    '<div class="litigant-greeting-row" style="margin-bottom:1.5rem">' +
      '<h1 class="litigant-greeting-title" style="font-size:1.45rem;font-weight:800;color:var(--fsc-navy-main)">Docket Information &amp; Charges</h1>' +
      '<p class="litigant-greeting-sub" style="font-size:0.85rem;color:#64748b;margin-top:0.25rem">Case Number: ' + (myCase.caseId || 'CASE-1787286146761') + ' · ' + (myCase.trackingCode || 'ET-FSC-837221') + '</p>' +
    '</div>' +
    '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
      '<div style="font-size:1rem;font-weight:800;color:var(--fsc-navy-main);margin-bottom:0.75rem">Case Statement &amp; Allegations</div>' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1rem;font-size:0.85rem;line-height:1.6;color:#334155;margin-bottom:1.25rem">' +
        (myCase.description || 'Full statement of the case on file with the Federal Supreme Court.') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:0.6rem">' +
        '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.825rem"><span style="color:#64748b">Applicable Law / Article:</span><span style="font-weight:700;color:#0369a1">' + (myCase.relevantLawArticle || 'Criminal Code Art. 675 - Fraud & Deception') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.825rem"><span style="color:#64748b">Court Level:</span><span>' + (myCase.courtLevel || 'Federal Supreme Court') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.825rem"><span style="color:#64748b">Presiding Judge:</span><span>' + (myCase.judgeName || 'Hon. Judge Solomon Desta') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;font-size:0.825rem"><span style="color:#64748b">Assigned Courtroom:</span><span>' + (myCase.courtroom || 'Courtroom 4 (Main Trial Room)') + '</span></div>' +
      '</div>' +
    '</div>';
}

function renderHearingsScheduleView() {
  const container = getWorkspaceContainer();
  if (!container) return;
  const myCase = getMyCase();

  container.innerHTML = 
    '<div class="litigant-greeting-row" style="margin-bottom:1.5rem">' +
      '<h1 class="litigant-greeting-title" style="font-size:1.45rem;font-weight:800;color:var(--fsc-navy-main)">Hearings Schedule &amp; Court Summons</h1>' +
      '<p class="litigant-greeting-sub" style="font-size:0.85rem;color:#64748b;margin-top:0.25rem">Mandatory appearance schedule before the Federal Supreme Court.</p>' +
    '</div>' +
    '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:1rem">' +
        '<div>' +
          '<div style="font-weight:800;color:#9a3412;font-size:1.05rem">Scheduled Trial Hearing</div>' +
          '<div style="font-size:0.85rem;color:#78350f;margin-top:0.25rem">Date: <strong>' + (myCase.hearingDate || '2026-08-21') + '</strong> at <strong>' + (myCase.hearingTime || '09:30 AM') + '</strong></div>' +
          '<div style="font-size:0.775rem;color:#9a3412;margin-top:0.25rem">Location: ' + (myCase.courtroom || 'Courtroom 4 (Main Trial Room)') + ' · ' + (myCase.courtLevel || 'Federal Supreme Court (Sidist Kilo)') + '</div>' +
        '</div>' +
        '<span style="background:#ea580c;color:#fff;font-size:0.75rem;font-weight:800;padding:0.25rem 0.65rem;border-radius:12px">SCHEDULED</span>' +
      '</div>' +
    '</div>';
}

function renderDocumentsView() {
  const container = getWorkspaceContainer();
  if (!container) return;
  const myCase = getMyCase();
  const docs = myCase.documents || [];

  const docRows = docs.length ? docs.map(d => 
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9">' +
      '<div style="display:flex;align-items:center;gap:0.75rem">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        '<div>' +
          '<div style="font-size:0.85rem;font-weight:700;color:var(--fsc-navy-main)">' + d.name + '</div>' +
          '<div style="font-size:0.725rem;color:#64748b">Uploaded by: ' + (d.uploadedBy || 'Litigant') + ' · ' + (d.size || '0.02 MB') + '</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-outline" style="padding:0.35rem 0.75rem;font-size:0.75rem;border-radius:4px;border:1px solid #cbd5e1;cursor:pointer" onclick="alert(\'Downloading ' + d.name + '\')">Download</button>' +
    '</div>'
  ).join('') : '<div style="padding:1.5rem;color:#64748b;font-size:0.85rem;text-align:center">No exhibits submitted yet.</div>';

  container.innerHTML = 
    '<div class="litigant-greeting-row" style="margin-bottom:1.5rem">' +
      '<h1 class="litigant-greeting-title" style="font-size:1.45rem;font-weight:800;color:var(--fsc-navy-main)">Evidence &amp; Submitted Documents</h1>' +
      '<p class="litigant-greeting-sub" style="font-size:0.85rem;color:#64748b;margin-top:0.25rem">Manage and submit trial exhibits, written pleadings, and witness declarations.</p>' +
    '</div>' +
    '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">' +
        '<h3 style="font-size:1rem;font-weight:800;color:var(--fsc-navy-main)">Case File Repository</h3>' +
        '<button class="btn btn-primary" style="background:var(--fsc-navy-main);color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;font-weight:700;cursor:pointer" onclick="document.getElementById(\'doc-file-input\').click()">+ Upload Exhibit</button>' +
      '</div>' +
      '<input type="file" id="doc-file-input" style="display:none" onchange="handleLitigantDocUpload(this)"/>' +
      '<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">' + docRows + '</div>' +
    '</div>';
}

function handleLitigantDocUpload(input) {
  if (input.files && input.files[0]) {
    alert('✓ Exhibit "' + input.files[0].name + '" submitted to court registrar for review.');
  }
}
window.handleLitigantDocUpload = handleLitigantDocUpload;

function renderSummonsNoticeView() {
  const container = getWorkspaceContainer();
  if (!container) return;
  const myCase = getMyCase();

  container.innerHTML = 
    '<div class="litigant-greeting-row" style="margin-bottom:1.5rem">' +
      '<h1 class="litigant-greeting-title" style="font-size:1.45rem;font-weight:800;color:var(--fsc-navy-main)">Official Court Summons &amp; Notice</h1>' +
      '<p class="litigant-greeting-sub" style="font-size:0.85rem;color:#64748b;margin-top:0.25rem">Sealed judicial notice issued by the Federal Supreme Court.</p>' +
    '</div>' +
    '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:2rem;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-top:4px solid var(--fsc-gold-main)">' +
      '<div style="text-align:center;padding:1rem 0 1.5rem;border-bottom:1px solid #e2e8f0">' +
        '<div style="font-size:1.15rem;font-weight:800;color:var(--fsc-navy-main);text-transform:uppercase">FEDERAL SUPREME COURT OF ETHIOPIA</div>' +
        '<div style="font-size:0.85rem;color:var(--fsc-gold-main);font-weight:700">CRIMINAL BENCH · SUMMONS TO APPEAR</div>' +
        '<div style="font-size:0.775rem;color:#64748b;margin-top:0.25rem">Case ID: <strong>' + (myCase.caseId || 'CASE-1787286146761') + '</strong> · Tracking: <strong>' + (myCase.trackingCode || 'ET-FSC-837221') + '</strong></div>' +
      '</div>' +
      '<div style="padding:1.5rem 0;line-height:1.7;font-size:0.875rem;color:#334155">' +
        'This is to officially notify the parties that oral hearing and examination of evidence for case <strong>' + (myCase.caseId || 'CASE-1787286146761') + '</strong> has been scheduled on <strong>' + (myCase.hearingDate || '2026-08-21') + ' at ' + (myCase.hearingTime || '09:30 AM') + '</strong> in <strong>' + (myCase.courtroom || 'Courtroom 4 (Main Trial Room)') + '</strong>.' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end">' +
        '<button class="btn btn-outline" style="border:1.5px solid var(--fsc-navy-main);color:var(--fsc-navy-main);font-weight:700;padding:0.6rem 1.25rem;border-radius:6px;cursor:pointer" onclick="window.print()">🖨️ Print Summons</button>' +
      '</div>' +
    '</div>';
}

function renderMessagesView() {
  const container = getWorkspaceContainer();
  if (!container) return;

  container.innerHTML = 
    '<div class="litigant-greeting-row" style="margin-bottom:1.5rem">' +
      '<h1 class="litigant-greeting-title" style="font-size:1.45rem;font-weight:800;color:var(--fsc-navy-main)">Registrar Communications</h1>' +
      '<p class="litigant-greeting-sub" style="font-size:0.85rem;color:#64748b;margin-top:0.25rem">Direct messages and inquiry submissions with the court registrar.</p>' +
    '</div>' +
    '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
      '<div style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:1rem">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.9rem;margin-bottom:0.35rem">Send Inquiry to Registrar Kalkidan Mengistu</div>' +
        '<textarea id="msg-to-registrar" class="top-search-input" style="width:100%;height:80px;margin-bottom:0.75rem;padding:0.5rem" placeholder="Type your inquiry or motion regarding case hearings or evidence filings..."></textarea>' +
        '<button class="btn btn-primary" style="background:var(--fsc-navy-main);color:#fff;border:none;padding:0.6rem 1.2rem;border-radius:6px;font-weight:700;font-size:0.825rem;cursor:pointer" onclick="alert(\'Inquiry dispatched to court registrar.\')">Send Message</button>' +
      '</div>' +
    '</div>';
}

// ── PROFILE DROPDOWN & LOGOUT ──
function toggleLitigantProfileDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('litigant-profile-dropdown-menu');
  if (menu) menu.classList.toggle('show');
}
window.toggleLitigantProfileDropdown = toggleLitigantProfileDropdown;

function handleLitigantGlobalClick(e) {
  const trigger = document.getElementById('litigant-profile-pill-trigger');
  const menu = document.getElementById('litigant-profile-dropdown-menu');
  if (menu && !menu.contains(e.target) && trigger && !trigger.contains(e.target)) {
    menu.classList.remove('show');
  }
}
window.handleLitigantGlobalClick = handleLitigantGlobalClick;

function logoutLitigant() {
  sessionStorage.removeItem('court_user');
  sessionStorage.removeItem('court_token');
  window.location.href = '/';
}
window.logoutLitigant = logoutLitigant;

// ── ACCESS COUNTDOWN TIMER ──
function startAccessCountdown() {
  let seconds = 3 * 3600 + 42 * 60 + 15;
  const el = document.getElementById('temp-access-countdown');
  if (!el) return;

  setInterval(() => {
    if (seconds <= 0) return;
    seconds--;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    el.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }, 1000);
}
