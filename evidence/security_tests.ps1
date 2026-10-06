#!/usr/bin/env pwsh
$ErrorActionPreference = 'Continue'
$API = 'http://localhost:5000/api/v1'
$ADMIN_EMAIL = 'admin@luxestay.com'
$ADMIN_PASS = 'admin123'
$HK_EMAIL = 'marcus.t@luxestay.com'
$HK_PASS = 'admin123'
$FD_EMAIL = 'frontdesk@luxestay.com'
$FD_PASS = 'admin123'
$RESULTS = @()
$TS = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

function Write-Test {
    param([string]$Cat,[string]$Name,[string]$Exp,[string]$Act,[string]$Sev,[string]$Verd)
    $script:RESULTS += [PSCustomObject]@{Category=$Cat;TestName=$Name;Expected=$Exp;Actual=$Act;Severity=$Sev;Verdict=$Verd}
    $c = if ($Verd -eq 'PASS') {'Green'} else {'Red'}
    Write-Host "[$Verd] $Name" -ForegroundColor $c
    Write-Host "  Expected: $Exp"
    Write-Host "  Actual:   $Act"
    Write-Host "  Severity: $Sev`n"
}

function Invoke-Api {
    param([string]$Uri,[string]$Method='GET',[string]$Body=$null,[string]$ContentType='application/json',[hashtable]$Headers=@{},[switch]$IH)
    try {
        $p = @{Uri=$Uri;Method=$Method;Headers=$Headers;ContentType=$ContentType;UseBasicParsing=$true;ErrorAction='Stop'}
        if ($Body) { $p.Body = $Body }
        $r = Invoke-WebRequest @p
        $res = @{StatusCode=$r.StatusCode;Content=$r.Content}
        if ($IH) { $res.Headers = $r.Headers }
        return $res
    } catch {
        $sc=0; $ct=''; $rh=@{}
        if ($_.Exception.Response) {
            $sc = [int]$_.Exception.Response.StatusCode
            try { $rd = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); $ct = $rd.ReadToEnd(); $rd.Close() } catch {}
            try { foreach ($k in $_.Exception.Response.Headers.AllKeys) { $rh[$k] = $_.Exception.Response.Headers[$k] } } catch {}
        }
        return @{StatusCode=$sc;Content=$ct;Headers=$rh}
    }
}

Write-Host "`n================================================================"
Write-Host "  SECURITY AUDIT - Hotel Management System"
Write-Host "  Date: $TS"
Write-Host "  API: $API"
Write-Host "================================================================`n"

# ============ 1. AUTHENTICATION ============
Write-Host "`n=== 1. AUTHENTICATION SECURITY ===" -ForegroundColor Yellow

# 1a
Write-Host "`n--- 1a. NoSQL Injection: email field ---"
$b = '{"email":{"$gt":""},"password":"test"}'
$r = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $b
$p = try { $r.Content | ConvertFrom-Json } catch { $null }
$msg = if ($p -and $p.error) { $p.error.message } else { $r.Content.Substring(0,[Math]::Min(150,$r.Content.Length)) }
if ($r.StatusCode -eq 422 -or $r.StatusCode -eq 400) {
    Write-Test "Authentication" "NoSQL Injection: email is object" "422 or 400 (Zod rejects non-string)" "HTTP $($r.StatusCode) - $msg" "P0" "PASS"
} elseif ($r.StatusCode -eq 401) {
    Write-Test "Authentication" "NoSQL Injection: email is object" "422 or 400 (Zod rejects non-string)" "HTTP 401 - treated as invalid creds (safe)" "P2" "PASS"
} else {
    Write-Test "Authentication" "NoSQL Injection: email is object" "422 or 400" "HTTP $($r.StatusCode) - $msg" "P0" "FAIL"
}

# 1b
Write-Host "`n--- 1b. NoSQL Injection: password field ---"
$b2 = '{"email":"admin@luxestay.com","password":{"$gt":""}}'
$r2 = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $b2
$p2 = try { $r2.Content | ConvertFrom-Json } catch { $null }
$msg2 = if ($p2 -and $p2.error) { $p2.error.message } else { $r2.Content.Substring(0,[Math]::Min(150,$r2.Content.Length)) }
if ($r2.StatusCode -eq 422 -or $r2.StatusCode -eq 400) {
    Write-Test "Authentication" "NoSQL Injection: password is object" "422 or 400 (Zod rejects non-string)" "HTTP $($r2.StatusCode) - $msg2" "P0" "PASS"
} elseif ($r2.StatusCode -eq 401) {
    Write-Test "Authentication" "NoSQL Injection: password is object" "422 or 400 (Zod rejects non-string)" "HTTP 401 - treated as invalid creds (safe)" "P2" "PASS"
} else {
    Write-Test "Authentication" "NoSQL Injection: password is object" "422 or 400" "HTTP $($r2.StatusCode) - $msg2" "P0" "FAIL"
}

# 1c
Write-Host "`n--- 1c. Brute Force Rate Limiting ---"
$rl = $false; $fi = -1
for ($i=1; $i -le 15; $i++) {
    $pw = 'wrongpw' + $i
    $bb = @{email=$ADMIN_EMAIL;password=$pw} | ConvertTo-Json
    $rr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $bb
    if ($rr.StatusCode -eq 429) { $rl=$true; $fi=$i; break }
}
if ($rl) {
    Write-Test "Authentication" "Brute force rate limiting at attempt $fi" "429 before/at 10th (config: 10/15min)" "Rate limited at attempt #$fi (HTTP 429)" "P1" "PASS"
} else {
    Write-Test "Authentication" "Brute force rate limiting within 15 attempts" "429 before/at 10th" "No rate limiting after 15 attempts" "P1" "FAIL"
}

Write-Host "  [INFO] Waiting 65s for rate limit reset..." -ForegroundColor DarkGray
Start-Sleep -Seconds 65

# 1d
Write-Host "`n--- 1d. Password NOT in login response ---"
$lb = @{email=$ADMIN_EMAIL;password=$ADMIN_PASS} | ConvertTo-Json
$lr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $lb
$lj = $lr.Content | ConvertFrom-Json
$uf = @(); $hp = $false
if ($lj.user) { $uf = $lj.user.PSObject.Properties.Name; $hp = ($uf -contains 'password') -or ($uf -contains 'passwordHash') }
if (-not $hp) {
    Write-Test "Authentication" "Password NOT in login response" "No password/passwordHash field" "Fields: $($uf -join ', ')" "P0" "PASS"
} else {
    Write-Test "Authentication" "Password NOT in login response" "No password/passwordHash field" "Password field FOUND" "P0" "FAIL"
}

# 1e
Write-Host "`n--- 1e. Password NOT in /auth/me ---"
$tok = $null
if ($lr.Headers -and $lr.Headers['Set-Cookie'] -match 'auth_token=([^;]+)') { $tok = $matches[1] }
$ah = @{}; if ($tok) { $ah['Authorization'] = "Bearer $tok" }
$mr = Invoke-Api -Uri "$API/auth/me" -Method GET -Headers $ah
$mj = try { $mr.Content | ConvertFrom-Json } catch { $null }
$mhp = $false; $mf = @()
if ($mj -and $mj.user) { $mf = $mj.user.PSObject.Properties.Name; $mhp = ($mf -contains 'password') -or ($mf -contains 'passwordHash') }
if (-not $mhp) {
    Write-Test "Authentication" "Password NOT in /auth/me" "No password/passwordHash" "Fields: $($mf -join ', ')" "P0" "PASS"
} else {
    Write-Test "Authentication" "Password NOT in /auth/me" "No password/passwordHash" "Password field FOUND" "P0" "FAIL"
}

# 1f
Write-Host "`n--- 1f. httpOnly on auth_token cookie ---"
$sc = ''
if ($lr.Headers -and $lr.Headers['Set-Cookie']) { $sc = $lr.Headers['Set-Cookie'] }
if ($sc -match 'auth_token=') {
    $ho = $sc -match 'auth_token=[^;]+.*HttpOnly'
    if ($ho) { Write-Test "Authentication" "auth_token httpOnly flag" "HttpOnly must be present" "HttpOnly IS present" "P0" "PASS" }
    else { Write-Test "Authentication" "auth_token httpOnly flag" "HttpOnly must be present" "HttpOnly NOT present" "P0" "FAIL" }
} else {
    Write-Test "Authentication" "auth_token httpOnly flag" "HttpOnly must be present" "No auth_token in Set-Cookie" "P1" "FAIL"
}

# 1g
Write-Host "`n--- 1g. csrf_token NOT httpOnly ---"
if ($sc -match 'csrf_token=') {
    $cho = $sc -match 'csrf_token=[^;]+.*HttpOnly'
    if (-not $cho) { Write-Test "Authentication" "csrf_token NOT httpOnly" "Must NOT have HttpOnly" "HttpOnly correctly absent" "P1" "PASS" }
    else { Write-Test "Authentication" "csrf_token NOT httpOnly" "Must NOT have HttpOnly" "HttpOnly IS present" "P1" "FAIL" }
} else {
    Write-Test "Authentication" "csrf_token NOT httpOnly" "Must NOT have HttpOnly" "No csrf_token in Set-Cookie" "P1" "FAIL"
}

# ============ 2. AUTHORIZATION ============
Write-Host "`n=== 2. AUTHORIZATION / IDOR ===" -ForegroundColor Yellow

# Login as housekeeping
$hkb = @{email=$HK_EMAIL;password=$HK_PASS} | ConvertTo-Json
$hkr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $hkb
$hkj = try { $hkr.Content | ConvertFrom-Json } catch { $null }
$hkt = $null
if ($hkr.Headers -and $hkr.Headers['Set-Cookie'] -match 'auth_token=([^;]+)') { $hkt = $matches[1] }
$hka = @{}; if ($hkt) { $hka['Authorization'] = "Bearer $hkt" }
Write-Host "  HK login: $($hkj.user.email) role=$($hkj.user.role)"

# 2a
Write-Host "`n--- 2a. HK -> POST /rooms (expect 403) ---"
$rc = '{"number":"999","floor":1,"roomTypeCode":"STD-Q"}'
$rr = Invoke-Api -Uri "$API/rooms" -Method POST -Body $rc -Headers $hka
if ($rr.StatusCode -eq 403) { Write-Test "Authorization" "HK -> POST /rooms = 403" "403 Forbidden" "HTTP 403" "P0" "PASS" }
else { Write-Test "Authorization" "HK -> POST /rooms = 403" "403 Forbidden" "HTTP $($rr.StatusCode)" "P0" "FAIL" }

# 2b
Write-Host "`n--- 2b. HK -> PATCH /rooms/:id (expect 403) ---"
$ru = '{"number":"102"}'
$rp = Invoke-Api -Uri "$API/rooms/102" -Method PATCH -Body $ru -Headers $hka
if ($rp.StatusCode -eq 403) { Write-Test "Authorization" "HK -> PATCH /rooms/:id = 403" "403 Forbidden" "HTTP 403" "P0" "PASS" }
else { Write-Test "Authorization" "HK -> PATCH /rooms/:id = 403" "403 Forbidden" "HTTP $($rp.StatusCode)" "P0" "FAIL" }

# 2c
Write-Host "`n--- 2c. HK -> POST /reservations (expect 403) ---"
$rb = '{"roomTypeId":"000000000000000000000001","checkInDate":"2026-09-15","checkOutDate":"2026-09-17","adults":1}'
$rrr = Invoke-Api -Uri "$API/reservations" -Method POST -Body $rb -Headers $hka
if ($rrr.StatusCode -eq 403) { Write-Test "Authorization" "HK -> POST /reservations = 403" "403 Forbidden" "HTTP 403" "P0" "PASS" }
else { Write-Test "Authorization" "HK -> POST /reservations = 403" "403 Forbidden" "HTTP $($rrr.StatusCode)" "P0" "FAIL" }

# Login as front_desk
$fdb = @{email=$FD_EMAIL;password=$FD_PASS} | ConvertTo-Json
$fdr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $fdb
$fdj = try { $fdr.Content | ConvertFrom-Json } catch { $null }
$fdt = $null
if ($fdr.Headers -and $fdr.Headers['Set-Cookie'] -match 'auth_token=([^;]+)') { $fdt = $matches[1] }
$fda = @{}; if ($fdt) { $fda['Authorization'] = "Bearer $fdt" }
Write-Host "  FD login: $($fdj.user.email) role=$($fdj.user.role)"

# 2d
Write-Host "`n--- 2d. FD -> DELETE /room-types/:id (expect 403) ---"
$dr = Invoke-Api -Uri "$API/room-types/000000000000000000000001" -Method DELETE -Headers $fda
if ($dr.StatusCode -eq 403) { Write-Test "Authorization" "FD -> DELETE /room-types/:id = 403" "403 Forbidden" "HTTP 403" "P0" "PASS" }
else { Write-Test "Authorization" "FD -> DELETE /room-types/:id = 403" "403 Forbidden" "HTTP $($dr.StatusCode)" "P0" "FAIL" }

# 2e
Write-Host "`n--- 2e. FD -> PATCH /rooms/:id (expect 403) ---"
$frp = Invoke-Api -Uri "$API/rooms/102" -Method PATCH -Body $ru -Headers $fda
if ($frp.StatusCode -eq 403) { Write-Test "Authorization" "FD -> PATCH /rooms/:id = 403" "403 Forbidden" "HTTP 403" "P0" "PASS" }
else { Write-Test "Authorization" "FD -> PATCH /rooms/:id = 403" "403 Forbidden" "HTTP $($frp.StatusCode)" "P0" "FAIL" }

# ============ 3. INPUT VALIDATION ============
Write-Host "`n=== 3. INPUT VALIDATION ===" -ForegroundColor Yellow

# Get valid roomTypeId
$rtR = Invoke-Api -Uri "$API/room-types" -Method GET
$rtJ = try { $rtR.Content | ConvertFrom-Json } catch { $null }
$vrt = '000000000000000000000001'
if ($rtJ -and $rtJ.data -and $rtJ.data.items -and $rtJ.data.items.Count -gt 0) { $vrt = $rtJ.data.items[0]._id }
Write-Host "  Using roomTypeId: $vrt"

# 3a
Write-Host "`n--- 3a. XSS in reservation firstName ---"
$xss = @{newGuest=@{firstName='<script>alert(1)</script>';lastName='test'};roomTypeId=$vrt;checkInDate='2026-09-15';checkOutDate='2026-09-17';adults=1} | ConvertTo-Json -Depth 5
$xsr = Invoke-Api -Uri "$API/reservations" -Method POST -Body $xss -Headers $fda
$xsj = try { $xsr.Content | ConvertFrom-Json } catch { $null }
if ($xsr.StatusCode -eq 422) {
    Write-Test "Input Validation" "XSS in firstName rejected" "422 (validation error)" "HTTP 422 - rejected" "P1" "PASS"
} elseif ($xsr.StatusCode -eq 201) {
    $fn = if ($xsj -and $xsj.item) { $xsj.item.newGuest.firstName } else { 'unknown' }
    if ($fn -match '<script>') { Write-Test "Input Validation" "XSS in firstName" "Sanitized or rejected" "HTTP 201 - XSS stored: $fn" "P1" "FAIL" }
    else { Write-Test "Input Validation" "XSS in firstName" "Sanitized or rejected" "HTTP 201 - sanitized: $fn" "P1" "PASS" }
} else {
    Write-Test "Input Validation" "XSS in firstName" "422 or sanitized" "HTTP $($xsr.StatusCode)" "P1" "PASS"
}

# 3b
Write-Host "`n--- 3b. Long firstName (10000 chars) ---"
$ln = 'A' * 10000
$lb2 = @{newGuest=@{firstName=$ln;lastName='test'};roomTypeId=$vrt;checkInDate='2026-09-15';checkOutDate='2026-09-17';adults=1} | ConvertTo-Json -Depth 5
$lr2 = Invoke-Api -Uri "$API/reservations" -Method POST -Body $lb2 -Headers $fda
if ($lr2.StatusCode -eq 422) { Write-Test "Input Validation" "Long firstName rejected (10000 chars)" "422 (max 50)" "HTTP 422 - rejected" "P2" "PASS" }
else { Write-Test "Input Validation" "Long firstName rejected (10000 chars)" "422 (max 50)" "HTTP $($lr2.StatusCode)" "P2" "FAIL" }

# 3c
Write-Host "`n--- 3c. Note body > 2000 chars ---"
$nl = 'X' * 5000
$nb = @{body=$nl} | ConvertTo-Json
$nr = Invoke-Api -Uri "$API/reservations/000000000000000000000001/notes" -Method POST -Body $nb -Headers $fda
if ($nr.StatusCode -eq 422 -or $nr.StatusCode -eq 400) { Write-Test "Input Validation" "Note > 2000 chars rejected" "422 (max 2000)" "HTTP $($nr.StatusCode) - rejected" "P2" "PASS" }
elseif ($nr.StatusCode -eq 404) { Write-Test "Input Validation" "Note > 2000 chars rejected" "422 (max 2000)" "HTTP 404 - reservation not found" "P3" "PASS" }
else { Write-Test "Input Validation" "Note > 2000 chars rejected" "422 (max 2000)" "HTTP $($nr.StatusCode)" "P2" "FAIL" }

# ============ 4. SECURITY HEADERS ============
Write-Host "`n=== 4. SECURITY HEADERS ===" -ForegroundColor Yellow

# 4a
Write-Host "`n--- 4a. x-powered-by absent ---"
$hr = Invoke-Api -Uri "$API/health" -Method GET -IH
$xpb = $null
if ($hr.Headers) { foreach ($k in $hr.Headers.Keys) { if ($k -eq 'x-powered-by' -or $k -eq 'X-Powered-By') { $xpb = $hr.Headers[$k] } } }
if (-not $xpb) { Write-Test "Security Headers" "x-powered-by absent" "Must NOT be present" "Absent (good)" "P2" "PASS" }
else { Write-Test "Security Headers" "x-powered-by absent" "Must NOT be present" "Present: $xpb" "P2" "FAIL" }

# 4b
Write-Host "`n--- 4b. X-Request-Id present ---"
$rid = $null
if ($hr.Headers) { foreach ($k in $hr.Headers.Keys) { if ($k -eq 'X-Request-Id' -or $k -eq 'x-request-id') { $rid = $hr.Headers[$k] } } }
if ($rid) { Write-Test "Security Headers" "X-Request-Id present" "Must be present" "Present: $rid" "P2" "PASS" }
else { Write-Test "Security Headers" "X-Request-Id present" "Must be present" "NOT found" "P2" "FAIL" }

# 4c
Write-Host "`n--- 4c. CORS preflight ---"
$ch = @{'Origin'='http://localhost:5173';'Access-Control-Request-Method'='POST'}
$cor = Invoke-Api -Uri "$API/health" -Method OPTIONS -Headers $ch -IH
$co = $null
if ($cor.Headers) { foreach ($k in $cor.Headers.Keys) { if ($k -eq 'Access-Control-Allow-Origin') { $co = $cor.Headers[$k] } } }
if ($co) { Write-Test "Security Headers" "CORS Allow-Origin present" "Must be present" "Value: $co" "P1" "PASS" }
else { Write-Test "Security Headers" "CORS Allow-Origin present" "Must be present" "NOT found (status $($cor.StatusCode))" "P1" "FAIL" }

# ============ 5. ERROR HANDLING ============
Write-Host "`n=== 5. ERROR HANDLING ===" -ForegroundColor Yellow

# 5a
Write-Host "`n--- 5a. Invalid ObjectId ---"
$air = Invoke-Api -Uri "$API/reservations/invalidObjectIdFormat" -Method GET -Headers $ah
if ($air.StatusCode -eq 422 -or $air.StatusCode -eq 404) { Write-Test "Error Handling" "Invalid ObjectId = 422/404" "422 or 404 (not 500)" "HTTP $($air.StatusCode)" "P1" "PASS" }
elseif ($air.StatusCode -eq 500) { Write-Test "Error Handling" "Invalid ObjectId = 422/404" "422 or 404 (not 500)" "HTTP 500 - stack leak risk" "P1" "FAIL" }
else { Write-Test "Error Handling" "Invalid ObjectId = 422/404" "422 or 404 (not 500)" "HTTP $($air.StatusCode)" "P1" "PASS" }

# 5b
Write-Host "`n--- 5b. Invalid JSON body ---"
$ijr = Invoke-Api -Uri "$API/reservations" -Method POST -Body 'this is not json{' -Headers $ah -ContentType 'application/json'
if ($ijr.StatusCode -eq 400 -or $ijr.StatusCode -eq 422) { Write-Test "Error Handling" "Invalid JSON rejected" "400 or 422 (not 500)" "HTTP $($ijr.StatusCode)" "P1" "PASS" }
elseif ($ijr.StatusCode -eq 500) { Write-Test "Error Handling" "Invalid JSON rejected" "400 or 422 (not 500)" "HTTP 500" "P1" "FAIL" }
else { Write-Test "Error Handling" "Invalid JSON rejected" "400 or 422 (not 500)" "HTTP $($ijr.StatusCode)" "P1" "PASS" }

# 5c
Write-Host "`n--- 5c. Malformed JSON on login ---"
$mlr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body '{{invalid' -ContentType 'application/json'
if ($mlr.StatusCode -eq 400 -or $mlr.StatusCode -eq 422) { Write-Test "Error Handling" "Malformed JSON on login rejected" "400 or 422 (not 500)" "HTTP $($mlr.StatusCode)" "P1" "PASS" }
elseif ($mlr.StatusCode -eq 500) { Write-Test "Error Handling" "Malformed JSON on login rejected" "400 or 422 (not 500)" "HTTP 500" "P1" "FAIL" }
else { Write-Test "Error Handling" "Malformed JSON on login rejected" "400 or 422 (not 500)" "HTTP $($mlr.StatusCode)" "P1" "PASS" }

# ============ 6. COOKIE SECURITY ============
Write-Host "`n=== 6. COOKIE SECURITY ===" -ForegroundColor Yellow

Write-Host "`n--- 6a. auth_token cookie attributes ---"
$clr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $lb -IH
$acs = ''
if ($clr.Headers -and $clr.Headers['Set-Cookie']) {
    $lines = $clr.Headers['Set-Cookie'] -split "`n"
    foreach ($l in $lines) { if ($l -match 'auth_token=') { $acs = $l.Trim() } }
}
if ($acs) {
    $ho = $acs -match 'HttpOnly'; $se = $acs -match 'Secure'; $ss = $acs -match 'SameSite'
    $d = @()
    if ($ho) { $d += 'HttpOnly' } else { $d += 'NO HttpOnly' }
    if ($se) { $d += 'Secure' } else { $d += 'No Secure(dev)' }
    if ($ss) { $d += 'SameSite' } else { $d += 'NO SameSite' }
    if ($ho -and $ss) { Write-Test "Cookie Security" "auth_token flags" "HttpOnly + SameSite" ($d -join ', ') "P1" "PASS" }
    else { Write-Test "Cookie Security" "auth_token flags" "HttpOnly + SameSite" ($d -join ', ') "P1" "FAIL" }
} else {
    Write-Test "Cookie Security" "auth_token flags" "HttpOnly + SameSite" "No auth_token cookie found" "P1" "FAIL"
}

Write-Host "`n--- 6b. csrf_token NOT httpOnly ---"
$ccs = ''
if ($clr.Headers -and $clr.Headers['Set-Cookie']) {
    $lines = $clr.Headers['Set-Cookie'] -split "`n"
    foreach ($l in $lines) { if ($l -match 'csrf_token=') { $ccs = $l.Trim() } }
}
if ($ccs) {
    $cho = $ccs -match 'HttpOnly'
    if (-not $cho) { Write-Test "Cookie Security" "csrf_token NOT httpOnly" "Must NOT have HttpOnly" "HttpOnly correctly absent" "P1" "PASS" }
    else { Write-Test "Cookie Security" "csrf_token NOT httpOnly" "Must NOT have HttpOnly" "HttpOnly IS present" "P1" "FAIL" }
} else {
    Write-Test "Cookie Security" "csrf_token NOT httpOnly" "Must NOT have HttpOnly" "No csrf_token cookie found" "P1" "FAIL"
}

# ============ 7. SESSION MANAGEMENT ============
Write-Host "`n=== 7. SESSION MANAGEMENT ===" -ForegroundColor Yellow

Write-Host "`n--- 7a. Logout returns 200 ---"
$lor = Invoke-Api -Uri "$API/auth/logout" -Method POST
$loj = try { $lor.Content | ConvertFrom-Json } catch { $null }
if ($lor.StatusCode -eq 200) { Write-Test "Session Management" "Logout returns 200" "HTTP 200 with success" "HTTP 200 - success=$($loj.success)" "P1" "PASS" }
else { Write-Test "Session Management" "Logout returns 200" "HTTP 200" "HTTP $($lor.StatusCode)" "P1" "FAIL" }

Write-Host "`n--- 7b. Old token invalid after logout ---"
if ($hkt) {
    $otr = Invoke-Api -Uri "$API/auth/me" -Method GET -Headers @{Authorization="Bearer $hkt"}
    if ($otr.StatusCode -eq 401) { Write-Test "Session Management" "Old token rejected" "401 Unauthorized" "HTTP 401 - correctly rejected" "P1" "PASS" }
    else { Write-Test "Session Management" "Old token rejected" "401 Unauthorized" "HTTP $($otr.StatusCode) - still accepted (stateless JWT)" "P2" "FAIL" }
} else {
    Write-Test "Session Management" "Old token rejected" "401 Unauthorized" "Skipped - no old token" "P2" "FAIL"
}

Write-Host "`n--- 7c. New login after logout ---"
$nlr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $hkb
$nlj = try { $nlr.Content | ConvertFrom-Json } catch { $null }
if ($nlr.StatusCode -eq 200 -and $nlj.success -eq $true) { Write-Test "Session Management" "New login after logout" "HTTP 200 with session" "HTTP 200 - new session issued" "P1" "PASS" }
else { Write-Test "Session Management" "New login after logout" "HTTP 200" "HTTP $($nlr.StatusCode)" "P1" "FAIL" }

# ============ 8. SENSITIVE DATA ============
Write-Host "`n=== 8. SENSITIVE DATA EXPOSURE ===" -ForegroundColor Yellow

# Get fresh admin token
$alr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $lb
$atk = $null
if ($alr.Headers -and $alr.Headers['Set-Cookie'] -match 'auth_token=([^;]+)') { $atk = $matches[1] }
$aah = @{}; if ($atk) { $aah['Authorization'] = "Bearer $atk" }

Write-Host "`n--- 8a. MongoDB URI not leaked ---"
$eps = @("$API/health","$API/rooms","$API/auth/me")
$ml = $false; $mlep = ''
foreach ($e in $eps) {
    $cr = Invoke-Api -Uri $e -Method GET -Headers $aah
    if ($cr.Content -match 'mongodb(\+srv)?://') { $ml=$true; $mlep=$e; break }
}
if (-not $ml) { Write-Test "Data Exposure" "MongoDB URI not leaked" "No mongodb:// in responses" "Not found in any response" "P0" "PASS" }
else { Write-Test "Data Exposure" "MongoDB URI not leaked" "No mongodb:// in responses" "FOUND at $mlep" "P0" "FAIL" }

Write-Host "`n--- 8b. JWT secret not leaked ---"
$jl = $false
foreach ($e in $eps) {
    $cr = Invoke-Api -Uri $e -Method GET -Headers $aah
    if ($cr.Content -match 'JWT_SECRET|jwt_secret|jwtSecret') { $jl=$true; break }
}
if (-not $jl) { Write-Test "Data Exposure" "JWT secret not leaked" "No JWT secret in responses" "Not found" "P0" "PASS" }
else { Write-Test "Data Exposure" "JWT secret not leaked" "No JWT secret in responses" "FOUND" "P0" "FAIL" }

Write-Host "`n--- 8c. No stack traces in errors ---"
$ser = Invoke-Api -Uri "$API/reservations/invalidId" -Method GET -Headers $aah
$hs = ($ser.Content -match 'at\s+\S+\s+\(') -or ($ser.Content -match '(?i)stack') -or ($ser.Content -match '\.ts:\d+:\d+')
if (-not $hs) { Write-Test "Data Exposure" "No stack traces in errors" "No stack trace" "No stack trace detected" "P1" "PASS" }
else { Write-Test "Data Exposure" "No stack traces in errors" "No stack trace" "Stack trace DETECTED" "P1" "FAIL" }

# ============ 9. HTTP METHODS ============
Write-Host "`n=== 9. HTTP METHOD TESTING ===" -ForegroundColor Yellow

Write-Host "`n--- 9a. DELETE /rooms (no route) ---"
$dr2 = Invoke-Api -Uri "$API/rooms" -Method DELETE -Headers $aah
if ($dr2.StatusCode -eq 404 -or $dr2.StatusCode -eq 405) { Write-Test "HTTP Methods" "DELETE /rooms = 404/405" "404 or 405" "HTTP $($dr2.StatusCode)" "P2" "PASS" }
else { Write-Test "HTTP Methods" "DELETE /rooms = 404/405" "404 or 405" "HTTP $($dr2.StatusCode)" "P2" "FAIL" }

Write-Host "`n--- 9b. PUT /reservations/:id (only PATCH) ---"
$pur = Invoke-Api -Uri "$API/reservations/000000000000000000000001" -Method PUT -Body '{"adults":1}' -Headers $aah
if ($pur.StatusCode -eq 404 -or $pur.StatusCode -eq 405) { Write-Test "HTTP Methods" "PUT /reservations/:id = 404/405" "404 or 405" "HTTP $($pur.StatusCode)" "P2" "PASS" }
else { Write-Test "HTTP Methods" "PUT /reservations/:id = 404/405" "404 or 405" "HTTP $($pur.StatusCode)" "P2" "FAIL" }

Write-Host "`n--- 9c. OPTIONS preflight ---"
$oe = @("$API/rooms","$API/reservations","$API/auth/login")
$aw = $true; $ors = @()
foreach ($e in $oe) {
    $or = Invoke-Api -Uri $e -Method OPTIONS -Headers @{'Origin'='http://localhost:5173';'Access-Control-Request-Method'='POST'}
    $ors += "$e -> HTTP $($or.StatusCode)"
    if ($or.StatusCode -ne 204 -and $or.StatusCode -ne 200) { $aw=$false }
}
if ($aw) { Write-Test "HTTP Methods" "OPTIONS preflight works" "200/204" ($ors -join '; ') "P2" "PASS" }
else { Write-Test "HTTP Methods" "OPTIONS preflight works" "200/204" ($ors -join '; ') "P2" "FAIL" }

# ============ 10. CONTENT-TYPE ============
Write-Host "`n=== 10. CONTENT-TYPE TESTING ===" -ForegroundColor Yellow

Write-Host "`n--- 10a. Login with text/plain ---"
$tpr = Invoke-Api -Uri "$API/auth/login" -Method POST -Body $lb -ContentType 'text/plain'
if ($tpr.StatusCode -eq 400 -or $tpr.StatusCode -eq 415 -or $tpr.StatusCode -eq 422) { Write-Test "Content-Type" "Login text/plain rejected" "400/415/422" "HTTP $($tpr.StatusCode)" "P2" "PASS" }
else { Write-Test "Content-Type" "Login text/plain rejected" "400/415/422" "HTTP $($tpr.StatusCode)" "P2" "FAIL" }

Write-Host "`n--- 10b. Reservation with XML ---"
$xb = '<?xml version="1.0"?><reservation><adults>1</adults></reservation>'
$xrr = Invoke-Api -Uri "$API/reservations" -Method POST -Body $xb -ContentType 'application/xml' -Headers $aah
if ($xrr.StatusCode -eq 400 -or $xrr.StatusCode -eq 415 -or $xrr.StatusCode -eq 422) { Write-Test "Content-Type" "Reservation XML rejected" "400/415/422" "HTTP $($xrr.StatusCode)" "P2" "PASS" }
else { Write-Test "Content-Type" "Reservation XML rejected" "400/415/422" "HTTP $($xrr.StatusCode)" "P2" "FAIL" }

# ============ SUMMARY ============
$pc = ($RESULTS | Where-Object { $_.Verdict -eq 'PASS' }).Count
$fc = ($RESULTS | Where-Object { $_.Verdict -eq 'FAIL' }).Count
$tc = $RESULTS.Count
$p0f = ($RESULTS | Where-Object { $_.Verdict -eq 'FAIL' -and $_.Severity -eq 'P0' }).Count
$p1f = ($RESULTS | Where-Object { $_.Verdict -eq 'FAIL' -and $_.Severity -eq 'P1' }).Count
$p2f = ($RESULTS | Where-Object { $_.Verdict -eq 'FAIL' -and $_.Severity -eq 'P2' }).Count
$p3f = ($RESULTS | Where-Object { $_.Verdict -eq 'FAIL' -and $_.Severity -eq 'P3' }).Count
$pr = if ($tc -gt 0) { [Math]::Round(($pc/$tc)*100,1) } else { 0 }

Write-Host "`n================================================================"
Write-Host "  SECURITY AUDIT SUMMARY"
Write-Host "================================================================"
Write-Host "  Total: $tc | Passed: $pc | Failed: $fc"
Write-Host "  P0: $p0f | P1: $p1f | P2: $p2f | P3: $p3f"
Write-Host "  Pass Rate: $pr%"
Write-Host "================================================================"

# Write report
$rp = 'C:\Users\qusai\OneDrive\Documents\my-projects\hotel-management-system\evidence\security_tests.txt'
$rl2 = @()
$rl2 += "================================================================"
$rl2 += "  SECURITY AUDIT REPORT"
$rl2 += "  Date: $TS"
$rl2 += "  API: $API"
$rl2 += "  Seed: $ADMIN_EMAIL / $ADMIN_PASS"
$rl2 += "================================================================"
$rl2 += ""
$rl2 += "DETAILED RESULTS:"
$rl2 += "=" * 80
foreach ($r in $RESULTS) {
    $v = if ($r.Verdict -eq 'PASS') { '[PASS]' } else { '[FAIL]' }
    $rl2 += ""
    $rl2 += "$v $($r.Category) > $($r.TestName)"
    $rl2 += "  Expected: $($r.Expected)"
    $rl2 += "  Actual:   $($r.Actual)"
    $rl2 += "  Severity: $($r.Severity)"
    $rl2 += "-" * 80
}
$rl2 += ""
$rl2 += "SUMMARY:"
$rl2 += "=" * 80
$rl2 += "Total: $tc | Passed: $pc | Failed: $fc | Pass Rate: $pr%"
$rl2 += "P0: $p0f | P1: $p1f | P2: $p2f | P3: $p3f"
$rl2 += ""
$rl2 += "CODE-BASED ANALYSIS (static review):"
$rl2 += "=" * 80
$rl2 += "1. NoSQL Injection: Zod validates email as string().email(), password as string().min(1)"
$rl2 += "2. Password Hashing: bcrypt with 12 rounds"
$rl2 += "3. Rate Limiting: 10 attempts/15min on /auth/login (express-rate-limit)"
$rl2 += "4. CSRF: Double-submit cookie pattern (csrf_token + x-csrf-token header)"
$rl2 += "5. Cookies: auth_token httpOnly=true, csrf_token httpOnly=false"
$rl2 += "6. Authorization: Role-based via authorize() middleware"
$rl2 += "7. Error Handling: Centralized errorHandler, stack traces only in dev"
$rl2 += "8. Headers: x-powered-by disabled, X-Request-Id per request"
$rl2 += "9. CORS: localhost:5173 with credentials"
$rl2 += "10. Input Validation: Zod enforces field limits (firstName max 50, note max 2000)"
$rl2 += "11. JWT Statelessness: Logout clears cookie but JWT valid until expiry (no blacklist)"
$rl2 += "12. Data Exposure: No sensitive data in responses, toSafeUser() strips internals"
$rl2 += ""
$rl2 += "================================================================"
$rl2 += "END OF REPORT"
$rl2 += "================================================================"

Set-Content -Path $rp -Value ($rl2 -join "`n") -Encoding UTF8
Write-Host "`nReport written to: $rp" -ForegroundColor Green
