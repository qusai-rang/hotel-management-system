/**
 * Comprehensive Playwright Browser Test Script — LuxeStay HMS
 * Run with: node evidence/browser_tests.js
 * Requires: @playwright/test installed, app running at http://localhost:5173
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const EVIDENCE_DIR = path.join(__dirname);
const SCREENSHOT_DIR = EVIDENCE_DIR;

// ── Logging helpers ──────────────────────────────────────────────────────────
const allConsoleLogs = [];
const allNetworkErrors = [];
const allWarnings = [];
const allErrors = [];
const screenshotsTaken = [];
const visualIssues = [];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  return line;
}

function screenshotName(flow, label) {
  const safe = label.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return `${flow}_${safe}.png`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const logLines = [];
  const pushLog = (msg) => { logLines.push(log(msg)); };

  pushLog('=== LuxeStay HMS — Comprehensive Browser Test Suite ===');
  pushLog(`Target: ${BASE_URL}`);
  pushLog(`Started: ${new Date().toLocaleString()}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // ── Capture ALL console messages ───────────────────────────────────────────
  page.on('console', (msg) => {
    const entry = { type: msg.type(), text: msg.text(), url: page.url(), ts: new Date().toISOString() };
    allConsoleLogs.push(entry);
    if (msg.type() === 'error') allErrors.push(entry);
    if (msg.type() === 'warning') allWarnings.push(entry);
  });

  page.on('pageerror', (err) => {
    allErrors.push({ type: 'pageerror', text: err.message, stack: err.stack, url: page.url(), ts: new Date().toISOString() });
  });

  // ── Capture network errors (status >= 400 or failed) ───────────────────────
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      const entry = {
        type: 'http-error',
        status,
        url: response.url(),
        statusText: response.statusText(),
        ts: new Date().toISOString(),
      };
      allNetworkErrors.push(entry);
    }
  });

  page.on('requestfailed', (request) => {
    const entry = {
      type: 'request-failed',
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? 'unknown',
      ts: new Date().toISOString(),
    };
    allNetworkErrors.push(entry);
  });

  const ts = (ms) => page.waitForTimeout(ms);

  async function snap(flow, label) {
    const fname = screenshotName(flow, label);
    const fpath = path.join(SCREENSHOT_DIR, fname);
    await page.screenshot({ path: fpath, fullPage: false });
    screenshotsTaken.push({ flow, label, file: fname });
    pushLog(`  📸 Screenshot: ${fname}`);
    return fname;
  }

  async function snapFull(flow, label) {
    const fname = screenshotName(flow, label);
    const fpath = path.join(SCREENSHOT_DIR, fname);
    await page.screenshot({ path: fpath, fullPage: true });
    screenshotsTaken.push({ flow, label, file: fname, fullPage: true });
    pushLog(`  📸 Full-page screenshot: ${fname}`);
    return fname;
  }

  async function safeGoto(url, opts = {}) {
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000, ...opts });
      await ts(1500);
      return resp;
    } catch (e) {
      pushLog(`  ⚠ Goto failed for ${url}: ${e.message}`);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 1: Login
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 1: LOGIN ━━━');
  try {
    await safeGoto(BASE_URL + '/');
    await ts(1000);
    const currentUrl = page.url();
    pushLog(`  Initial URL after goto: ${currentUrl}`);
    await snap('flow01_login', '01_redirect_to_login');

    const pageTitle = await page.textContent('h1, h2, [class*="headline"]').catch(() => null);
    pushLog(`  Page title element: ${pageTitle}`);
    await snap('flow01_login', '02_login_page_loaded');

    // Fill credentials
    await page.fill('#email', 'admin@luxestay.com');
    await page.fill('#password', 'admin123');
    await ts(500);
    await snap('flow01_login', '03_credentials_filled');

    // Click Sign In
    await page.click('button[type="submit"]');
    pushLog('  Clicked Sign In button');

    // Wait for navigation to dashboard
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      pushLog(`  ✅ Navigated to: ${page.url()}`);
    } catch (e) {
      pushLog(`  ⚠ Navigation timeout — current URL: ${page.url()}`);
    }
    await ts(2000);
    await snap('flow01_login', '04_dashboard_after_login');
  } catch (e) {
    pushLog(`  ❌ Flow 1 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 2: Dashboard
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 2: DASHBOARD ━━━');
  try {
    if (!page.url().includes('dashboard')) {
      await safeGoto(BASE_URL + '/dashboard');
    }
    await ts(2000);

    // Check for key dashboard elements
    const hasOccupancy = await page.locator('text=/occupancy/i').count();
    const hasArrivals = await page.locator('text=/arrivals?|pending/i').count();
    const hasRevenue = await page.locator('text=/revenue/i').count();
    const hasRecentBookings = await page.locator('text=/recent bookings/i').count();
    const hasChart = await page.locator('text=/occupancy trend/i').count();
    const hasQuickActions = await page.locator('text=/quick actions/i').count();

    pushLog(`  Dashboard elements — Occupancy:${hasOccupancy} Arrivals:${hasArrivals} Revenue:${hasRevenue} RecentBookings:${hasRecentBookings} Chart:${hasChart} QuickActions:${hasQuickActions}`);

    if (hasOccupancy === 0 && hasRecentBookings === 0) {
      visualIssues.push('Dashboard may be empty — no key metric text found');
      pushLog('  ⚠ VISUAL ISSUE: Dashboard appears empty or not loaded');
    }

    await snap('flow02_dashboard', '01_dashboard_full');
    await snapFull('flow02_dashboard', '02_dashboard_fullpage');

    // Check for broken images
    const brokenImages = await page.$$eval('img', (imgs) =>
      imgs.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src)
    );
    if (brokenImages.length > 0) {
      pushLog(`  ⚠ Broken images: ${JSON.stringify(brokenImages)}`);
      visualIssues.push(`Broken images: ${brokenImages.join(', ')}`);
    } else {
      pushLog('  ✅ No broken images detected');
    }
  } catch (e) {
    pushLog(`  ❌ Flow 2 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 3: Reservations List
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 3: RESERVATIONS LIST ━━━');
  try {
    await safeGoto(BASE_URL + '/reservations');
    await ts(2500);
    await snap('flow03_reservations', '01_reservations_page');

    // Check table rows
    const tableRows = await page.locator('table tbody tr').count();
    pushLog(`  Table rows visible: ${tableRows}`);
    if (tableRows === 0) {
      visualIssues.push('Reservations table has no rows');
      pushLog('  ⚠ VISUAL ISSUE: No table rows in reservations');
    }

    // Test status filter — select "Confirmed"
    const statusSelect = page.locator('#filter-status');
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('Confirmed');
      await ts(1000);
      await snap('flow03_reservations', '02_filtered_confirmed');
      const filteredRows = await page.locator('table tbody tr').count();
      pushLog(`  After 'Confirmed' filter: ${filteredRows} rows`);
    }

    // Test search — use the second search input (the table filter, not the shell pill)
    const searchInput = page.locator('input[aria-label*="Search guests or ID"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('guest');
      await ts(1000);
      await snap('flow03_reservations', '03_search_filtered');
      const searchRows = await page.locator('table tbody tr').count();
      pushLog(`  After search 'guest': ${searchRows} rows`);
    }

    // Reset
    await statusSelect.selectOption('All Statuses');
    await searchInput.fill('');
    await ts(500);
    await snap('flow03_reservations', '04_reservations_reset');
  } catch (e) {
    pushLog(`  ❌ Flow 3 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 4: Create Reservation Wizard
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 4: CREATE RESERVATION ━━━');
  try {
    await safeGoto(BASE_URL + '/reservations/new');
    await ts(2000);
    await snap('flow04_create_reservation', '01_wizard_step1');

    // Try to interact with Step 1 — guest/room type selection
    const guestRadios = await page.locator('input[type="radio"]').count();
    pushLog(`  Radio buttons on page: ${guestRadios}`);

    // The radio inputs are hidden (sr-only), so click the visible label instead
    const radioLabel = page.locator('label').filter({ has: page.locator('input[type="radio"]') }).first();
    if (await radioLabel.count() > 0) {
      await radioLabel.click({ timeout: 5000 });
      await ts(500);
      pushLog('  Selected first radio option via label');
    } else {
      pushLog('  ⚠ No radio labels found');
    }

    await snap('flow04_create_reservation', '02_guest_selected');

    // Try to advance to next step
    const nextBtn = page.locator('button').filter({ hasText: /next|continue|step|proceed/i }).first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await ts(1500);
      await snap('flow04_create_reservation', '03_step2');
      pushLog('  Advanced to step 2');
    } else {
      pushLog('  ⚠ Could not find Next/Continue button');
    }

    // Try step 3
    const nextBtn2 = page.locator('button').filter({ hasText: /next|continue|step|proceed/i }).first();
    if (await nextBtn2.count() > 0) {
      await nextBtn2.click();
      await ts(1500);
      await snap('flow04_create_reservation', '04_step3');
      pushLog('  Advanced to step 3');
    }

    await snap('flow04_create_reservation', '05_final_step');
  } catch (e) {
    pushLog(`  ❌ Flow 4 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 5: Reservation Details
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 5: RESERVATION DETAILS ━━━');
  try {
    await safeGoto(BASE_URL + '/reservations');
    await ts(2500);

    // Click first row in the table
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await ts(2000);
      pushLog(`  Navigated to reservation detail: ${page.url()}`);
      await snap('flow05_reservation_details', '01_detail_page');

      // Check for key info sections
      const hasGuestInfo = await page.locator('text=/guest|name|contact/i').count();
      const hasRoomInfo = await page.locator('text=/room|suite|floor/i').count();
      const hasDates = await page.locator('text=/check.?in|check.?out|date/i').count();
      const hasPayment = await page.locator('text=/payment|total|amount|charge|deposit/i').count();
      pushLog(`  Detail sections — Guest:${hasGuestInfo} Room:${hasRoomInfo} Dates:${hasDates} Payment:${hasPayment}`);

      if (hasGuestInfo === 0 && hasRoomInfo === 0) {
        visualIssues.push('Reservation detail page may be missing key information');
        pushLog('  ⚠ VISUAL ISSUE: Detail page content sparse');
      }

      await snapFull('flow05_reservation_details', '02_detail_fullpage');
    } else {
      pushLog('  ⚠ No reservation rows to click');
    }
  } catch (e) {
    pushLog(`  ❌ Flow 5 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 6: Rooms Grid
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 6: ROOMS GRID ━━━');
  try {
    await safeGoto(BASE_URL + '/rooms');
    await ts(2500);
    await snap('flow06_rooms', '01_rooms_grid');

    // Check for room cards
    const roomCards = await page.locator('[class*="room"], [data-room], [class*="card"]').count();
    pushLog(`  Room card-like elements: ${roomCards}`);

    // Check for status badges
    const statusBadges = await page.locator('text=/available|occupied|dirty|maintenance/i').count();
    pushLog(`  Status badges found: ${statusBadges}`);

    // Check for floor filters
    const floorFilter = await page.locator('text=/floor/i').count();
    pushLog(`  Floor filter present: ${floorFilter > 0}`);

    if (roomCards === 0 && statusBadges === 0) {
      visualIssues.push('Rooms grid appears empty or cards not rendered');
      pushLog('  ⚠ VISUAL ISSUE: Rooms grid may be empty');
    }

    // Try filtering by status
    const statusFilter = page.locator('button, [role="tab"]').filter({ hasText: /available|occupied|dirty|maintenance/i });
    const statusCount = await statusFilter.count();
    if (statusCount > 0) {
      await statusFilter.first().click();
      await ts(1000);
      await snap('flow06_rooms', '02_status_filtered');
      pushLog('  Applied status filter');
    }

    await snapFull('flow06_rooms', '03_rooms_fullpage');
  } catch (e) {
    pushLog(`  ❌ Flow 6 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 7: Room Management
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 7: ROOM MANAGEMENT ━━━');
  try {
    await safeGoto(BASE_URL + '/rooms/manage');
    await ts(2500);
    await snap('flow07_room_management', '01_management_view');

    const managementCards = await page.locator('[class*="card"], [class*="room"]').count();
    pushLog(`  Management card elements: ${managementCards}`);

    const hasFilters = await page.locator('text=/floor|status|type/i').count();
    pushLog(`  Filter controls present: ${hasFilters > 0}`);

    await snapFull('flow07_room_management', '02_management_fullpage');
  } catch (e) {
    pushLog(`  ❌ Flow 7 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 8: Room Configuration (Settings)
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 8: ROOM CONFIGURATION ━━━');
  try {
    await safeGoto(BASE_URL + '/settings');
    await ts(2500);
    await snap('flow08_settings', '01_configuration_page');

    const hasRoomTypes = await page.locator('text=/room.?type|standard|deluxe|executive|premium/i').count();
    const hasFloorMgmt = await page.locator('text=/floor/i').count();
    pushLog(`  Config elements — RoomTypes: ${hasRoomTypes}, FloorMgmt: ${hasFloorMgmt}`);

    if (hasRoomTypes === 0 && hasFloorMgmt === 0) {
      visualIssues.push('Settings page content appears sparse');
      pushLog('  ⚠ VISUAL ISSUE: Settings page may be empty');
    }

    await snapFull('flow08_settings', '02_configuration_fullpage');
  } catch (e) {
    pushLog(`  ❌ Flow 8 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 9: Guest Profile
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 9: GUEST PROFILE ━━━');
  try {
    // Navigate to reservation detail to find a guest link
    await safeGoto(BASE_URL + '/reservations');
    await ts(2500);

    const firstRow = page.locator('table tbody tr').first();
    let guestUrl = null;
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await ts(2500);
      pushLog(`  On reservation detail: ${page.url()}`);

      // Look for any link containing /guests/ on the detail page
      const guestProfileLink = page.locator('a[href*="/guests/"]').first();
      if (await guestProfileLink.count() > 0) {
        guestUrl = await guestProfileLink.getAttribute('href');
        pushLog(`  Found guest link on detail page: ${guestUrl}`);
      } else {
        // Try finding any clickable element that navigates to a guest
        pushLog('  No <a> guest link found. Trying API fallback...');
      }
    }

    // API fallback: get a reservation to extract guest ID
    if (!guestUrl) {
      const apiResp = await page.evaluate(async () => {
        try {
          // Try the API endpoint that the app uses
          const token = localStorage.getItem('token') || '';
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch('/api/v1/reservations?pageSize=1', { headers });
          if (!res.ok) {
            // Try alternate endpoint
            const res2 = await fetch('/api/reservations?pageSize=1', { headers });
            if (res2.ok) return await res2.json();
            return null;
          }
          return await res.json();
        } catch (e) { return null; }
      });

      if (apiResp && apiResp.items && apiResp.items.length > 0) {
        const item = apiResp.items[0];
        const guest = item.guest;
        if (guest) {
          const slug = guest.slug || guest.id;
          guestUrl = '/guests/' + slug;
          pushLog(`  Found guest via API: ${guest.fullName} (slug: ${slug})`);
        }
      }
    }

    if (guestUrl) {
      await safeGoto(BASE_URL + guestUrl);
      await ts(2500);
    } else {
      pushLog('  ⚠ Could not find a guest to navigate to');
      // Try a direct navigate to a known pattern
      await safeGoto(BASE_URL + '/reservations');
      await ts(2000);
    }

    await snap('flow09_guest_profile', '01_guest_profile');

    const hasGuestDetails = await page.locator('text=/guest|profile|contact|phone|email|name|history/i').count();
    pushLog(`  Guest profile content elements: ${hasGuestDetails}`);

    await snapFull('flow09_guest_profile', '02_guest_profile_fullpage');
  } catch (e) {
    pushLog(`  ❌ Flow 9 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 10: Housekeeping
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 10: HOUSEKEEPING ━━━');
  try {
    await safeGoto(BASE_URL + '/housekeeping');
    await ts(2500);
    await snap('flow10_housekeeping', '01_housekeeping_page');

    const hasTasks = await page.locator('table tbody tr, [class*="task"]').count();
    const hasStats = await page.locator('text=/dirty|clean|inspection|in.?progress/i').count();
    pushLog(`  Housekeeping — Tasks: ${hasTasks}, Stats labels: ${hasStats}`);

    if (hasTasks === 0 && hasStats === 0) {
      visualIssues.push('Housekeeping page appears empty');
      pushLog('  ⚠ VISUAL ISSUE: Housekeeping content not visible');
    }

    await snapFull('flow10_housekeeping', '02_housekeeping_fullpage');
  } catch (e) {
    pushLog(`  ❌ Flow 10 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 11: Billing
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 11: BILLING ━━━');
  try {
    await safeGoto(BASE_URL + '/billing');
    await ts(2500);
    await snap('flow11_billing', '01_billing_page');

    const hasTransactions = await page.locator('table tbody tr, [class*="transaction"]').count();
    const hasMetrics = await page.locator('text=/revenue|total|captured|pending|refunded/i').count();
    pushLog(`  Billing — Transactions: ${hasTransactions}, Metrics: ${hasMetrics}`);

    if (hasTransactions === 0 && hasMetrics === 0) {
      visualIssues.push('Billing page appears empty');
      pushLog('  ⚠ VISUAL ISSUE: Billing content not visible');
    }

    await snapFull('flow11_billing', '02_billing_fullpage');
  } catch (e) {
    pushLog(`  ❌ Flow 11 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 12: 404 Page
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 12: 404 PAGE ━━━');
  try {
    await safeGoto(BASE_URL + '/nonexistent-page-xyz');
    await ts(2000);
    await snap('flow12_404', '01_404_page');

    const has404 = await page.locator('text=/404|not found/i').count();
    const hasBackLink = await page.locator('a[href="/dashboard"]').count();
    const hasBackText = await page.locator('text=/back to dashboard/i').count();
    pushLog(`  404 page — "Not Found" text: ${has404}, Back link: ${hasBackLink}, Back text: ${hasBackText}`);

    if (has404 === 0) {
      visualIssues.push('404 page may not be rendering properly');
      pushLog('  ⚠ VISUAL ISSUE: 404 page text not found');
    }
    if (hasBackLink === 0 && hasBackText === 0) {
      visualIssues.push('404 page missing "Back to Dashboard" link');
      pushLog('  ⚠ VISUAL ISSUE: No "Back to Dashboard" link on 404');
    }
  } catch (e) {
    pushLog(`  ❌ Flow 12 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 13: Unauthorized Access (after clearing cookies)
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 13: UNAUTHORIZED ACCESS ━━━');
  try {
    await context.clearCookies();
    pushLog('  Cookies cleared');
    await ts(500);

    await safeGoto(BASE_URL + '/dashboard');
    await ts(2000);
    const currentUrl = page.url();
    pushLog(`  After navigating to /dashboard without auth: ${currentUrl}`);
    await snap('flow13_unauthorized', '01_redirect_to_login');

    if (currentUrl.includes('login')) {
      pushLog('  ✅ Correctly redirected to login');
    } else {
      pushLog(`  ⚠ Expected redirect to /login, but URL is: ${currentUrl}`);
      visualIssues.push('Unauthorized access did not redirect to login');
    }
  } catch (e) {
    pushLog(`  ❌ Flow 13 error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Re-login for remaining flows
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ RE-LOGIN FOR REMAINING FLOWS ━━━');
  try {
    await safeGoto(BASE_URL + '/login');
    await ts(1500);
    await page.fill('#email', 'admin@luxestay.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await ts(2000);
    pushLog(`  ✅ Re-logged in, at: ${page.url()}`);
  } catch (e) {
    pushLog(`  ⚠ Re-login failed: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 14: Desktop Full-Page Screenshots
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 14: DESKTOP FULL-PAGE SCREENSHOTS ━━━');
  const fullPages = [
    { path: '/dashboard', name: 'dashboard' },
    { path: '/reservations', name: 'reservations' },
    { path: '/rooms', name: 'rooms' },
    { path: '/housekeeping', name: 'housekeeping' },
    { path: '/billing', name: 'billing' },
  ];
  for (const p of fullPages) {
    try {
      await safeGoto(BASE_URL + p.path);
      await ts(2500);
      await snapFull(`flow14_desktop_fullpage`, `${p.name}_desktop_full`);
    } catch (e) {
      pushLog(`  ❌ Full-page ${p.name} error: ${e.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 15: Responsive Design — Tablet (768px)
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 15a: TABLET VIEW (768px) ━━━');
  try {
    await page.setViewportSize({ width: 768, height: 1024 });
    await ts(500);
    for (const p of [{ path: '/dashboard', name: 'dashboard' }, { path: '/reservations', name: 'reservations' }]) {
      await safeGoto(BASE_URL + p.path);
      await ts(2000);
      await snap(`flow15a_tablet`, `${p.name}_tablet_768`);
    }
  } catch (e) {
    pushLog(`  ❌ Tablet view error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW 15b: Responsive Design — Mobile (375px)
  // ─────────────────────────────────────────────────────────────────────────
  pushLog('\n━━━ FLOW 15b: MOBILE VIEW (375px) ━━━');
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    await ts(500);
    for (const p of [{ path: '/dashboard', name: 'dashboard' }, { path: '/reservations', name: 'reservations' }]) {
      await safeGoto(BASE_URL + p.path);
      await ts(2000);
      await snap(`flow15b_mobile`, `${p.name}_mobile_375`);
    }
  } catch (e) {
    pushLog(`  ❌ Mobile view error: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY & REPORT
  // ─────────────────────────────────────────────────────────────────────────
  await browser.close();

  pushLog('\n' + '═'.repeat(70));
  pushLog('  TEST SUITE SUMMARY');
  pushLog('═'.repeat(70));

  pushLog(`\n📸 Screenshots Taken: ${screenshotsTaken.length}`);
  for (const s of screenshotsTaken) {
    pushLog(`   ${s.flow} | ${s.label} → ${s.file}${s.fullPage ? ' [full-page]' : ''}`);
  }

  pushLog(`\n🔴 Console Errors: ${allErrors.length}`);
  for (const e of allErrors) {
    pushLog(`   [${e.type}] ${e.text}`);
    if (e.url) pushLog(`      URL: ${e.url}`);
  }

  pushLog(`\n🟡 Console Warnings: ${allWarnings.length}`);
  for (const w of allWarnings) {
    pushLog(`   ${w.text}`);
  }

  pushLog(`\n🌐 Network Errors (HTTP ≥400 or failed): ${allNetworkErrors.length}`);
  for (const ne of allNetworkErrors) {
    if (ne.type === 'http-error') {
      pushLog(`   HTTP ${ne.status} ${ne.statusText} — ${ne.url}`);
    } else {
      pushLog(`   REQUEST FAILED — ${ne.url} (${ne.failure})`);
    }
  }

  pushLog(`\n🖼 Visual Issues Identified: ${visualIssues.length}`);
  for (const v of visualIssues) {
    pushLog(`   ⚠ ${v}`);
  }

  pushLog(`\nCompleted: ${new Date().toLocaleString()}`);
  pushLog('═'.repeat(70));

  // Write results to file
  const resultsPath = path.join(EVIDENCE_DIR, 'browser_results.txt');
  fs.writeFileSync(resultsPath, logLines.join('\n'), 'utf-8');
  console.log(`\n✅ Results saved to: ${resultsPath}`);
})();
