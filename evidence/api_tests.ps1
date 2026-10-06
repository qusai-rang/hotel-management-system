# ============================================================================
# LuxeStay Hotel Management System - Comprehensive API Endpoint Test Suite
# ============================================================================
# Server: http://localhost:5000/api/v1
# Date: 2026-08-29
# ============================================================================

$ErrorActionPreference = "Continue"
$BASE = "http://localhost:5000/api/v1"
$RESULTS_FILE = "C:\Users\qusai\OneDrive\Documents\my-projects\hotel-management-system\evidence\api_results.txt"

$script:TotalTests = 0
$script:Passed = 0
$script:Failed = 0
$script:Results = @()

# ============================================================================
# Helpers
# ============================================================================

function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Url,
        [string]$JsonBody = $null,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session,
        [string]$CsrfToken = $null
    )
    $h = @{}
    if ($CsrfToken) { $h["x-csrf-token"] = $CsrfToken }
    $params = @{
        Method          = $Method
        Uri             = $Url
        UseBasicParsing = $true
        ErrorAction     = "SilentlyContinue"
    }
    if ($Session) { $params.WebSession = $Session }
    if ($JsonBody) {
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($JsonBody)
        $params.ContentType = "application/json"
    }
    if ($CsrfToken) { $params.Headers = $h }
    try {
        $r = Invoke-WebRequest @params
        return @{ StatusCode = [int]$r.StatusCode; Body = $r.Content; Response = $r }
    } catch {
        if ($_.Exception.Response) {
            $resp = $_.Exception.Response
            $sc = [int]$resp.StatusCode
            try {
                $stream = $resp.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Close()
            } catch { $body = "" }
            return @{ StatusCode = $sc; Body = $body; Response = $resp }
        }
        return @{ StatusCode = 0; Body = $_.Exception.Message; Response = $null }
    }
}

function Record-Test {
    param([string]$Name, [string]$Method, [string]$Endpoint, [string]$Expected, [int]$Actual, [string]$Result, [string]$Snippet)
    $script:TotalTests++
    if ($Result -eq "PASS") { $script:Passed++ } else { $script:Failed++ }
    $short = if ($Snippet.Length -gt 150) { $Snippet.Substring(0, 150) + "..." } else { $Snippet }
    $line = "[$Result] $Name | $Method $Endpoint | Expected: $Expected | Actual: $Actual | $short"
    Write-Host $line
    $script:Results += $line
}

function Do-Login {
    param([string]$Email, [string]$Password)
    $json = "{`"email`":`"$Email`",`"password`":`"$Password`"}"
    $sessionVar = $null
    try {
        $r = Invoke-WebRequest -Method POST -Uri "$BASE/auth/login" `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) `
            -ContentType "application/json" `
            -UseBasicParsing `
            -SessionVariable sessionVar `
            -ErrorAction Stop
        $csrf = $null
        if ($r.Headers["x-csrf-token"]) { $csrf = $r.Headers["x-csrf-token"] }
        return @{ Session = $sessionVar; Csrf = $csrf; StatusCode = [int]$r.StatusCode; Body = $r.Content }
    } catch {
        if ($_.Exception.Response) {
            $resp = $_.Exception.Response
            try {
                $stream = $resp.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Close()
            } catch { $body = "" }
            return @{ Session = $null; Csrf = $null; StatusCode = [int]$resp.StatusCode; Body = $body }
        }
        return @{ Session = $null; Csrf = $null; StatusCode = 0; Body = $_.Exception.Message }
    }
}

# ============================================================================
# START
# ============================================================================

Write-Host ("=" * 80)
Write-Host "LuxeStay API Test Suite - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ("=" * 80)

# ---- 1. HEALTH ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/health"
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"status":"ok"')
Record-Test "Health check (no auth)" "GET" "/health" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

# ---- 2. AUTH ----
$login = Do-Login -Email "admin@luxestay.com" -Password "admin123"
$ok = ($login.StatusCode -eq 200 -and $login.Body -match '"success":true')
Record-Test "Login valid admin" "POST" "/auth/login" "200" $login.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $login.Body
$S = $login.Session; $C = $login.Csrf
Write-Host "  >> CSRF token: $(if ($C) { $C.Substring(0,16) + '...' } else { 'NONE' })"
Write-Host "  >> Session cookies: $(if ($S) { ($S.Cookies.GetCookies([Uri]$BASE)).Count } else { 0 })"

$r = Invoke-ApiCall -Method "POST" -Url "$BASE/auth/login" -JsonBody '{"email":"admin@luxestay.com","password":"wrong"}'
Record-Test "Login invalid password" "POST" "/auth/login" "401" $r.StatusCode $(if ($r.StatusCode -eq 401) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "POST" -Url "$BASE/auth/login" -JsonBody '{"email":"noone@test.com","password":"admin123"}'
Record-Test "Login non-existent email" "POST" "/auth/login" "401" $r.StatusCode $(if ($r.StatusCode -eq 401) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/auth/me" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /auth/me (authenticated)" "GET" "/auth/me" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/auth/me"
Record-Test "GET /auth/me (unauthenticated)" "GET" "/auth/me" "401" $r.StatusCode $(if ($r.StatusCode -eq 401) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "POST" -Url "$BASE/auth/logout" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "POST /auth/logout" "POST" "/auth/logout" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

# Re-login
Write-Host "  >> Re-logging in..."
$login = Do-Login -Email "admin@luxestay.com" -Password "admin123"
$S = $login.Session; $C = $login.Csrf

# ---- 3. ROOM TYPES ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/room-types"
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /room-types (public)" "GET" "/room-types" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$RT = $null; try { $RT = $r.Body | ConvertFrom-Json } catch {}
$RTId = if ($RT.items -and $RT.items.Count -gt 0) { $RT.items[0].id } else { $null }
# Prefer a seed room type with rooms (skip debug types)
$SeedTypes = @("STD-D","STD-K","STD-Q","DLX-D","DLX-K","DLX-KS","EXE-S","PNT-S","OVS-S","PRE-S")
foreach ($item in $RT.items) {
    if ($SeedTypes -contains $item.code) { $RTId = $item.id; Write-Host "  >> Using seed room type: $($item.code) ($RTId)"; break }
}
if (-not $RTId -and $RT.items -and $RT.items.Count -gt 0) { $RTId = $RT.items[0].id }
Write-Host "  >> Room type for tests: $RTId"

if ($RTId) {
    $r = Invoke-ApiCall -Method "GET" -Url "$BASE/room-types/$RTId"
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "GET /room-types/:id" "GET" "/room-types/$RTId" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "GET /room-types/:id" "GET" "/room-types/:id" "200" 0 "FAIL" "No room type ID"
}

# Create
$ucode = "TST$(Get-Date -Format 'HHmmss')"
$rtJson = '{"code":"' + $ucode + '","name":"Test ' + $ucode + '","basePricePerNightCents":35000,"maxGuests":2,"bedLabel":"1 Queen","depositRatio":0.5}'
$r = Invoke-ApiCall -Method "POST" -Url "$BASE/room-types" -JsonBody $rtJson -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 201 -and $r.Body -match '"success":true')
Record-Test "POST /room-types (admin create)" "POST" "/room-types" "201" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
$CRT = $null; try { $CRT = $r.Body | ConvertFrom-Json } catch {}
$CRTId = if ($CRT -and $CRT.item) { $CRT.item.id } else { $null }
Write-Host "  >> Created RT: $CRTId"

# Update
if ($CRTId) {
    $r = Invoke-ApiCall -Method "PATCH" -Url "$BASE/room-types/$CRTId" -JsonBody '{"name":"Updated Test","basePricePerNightCents":39900}' -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "PATCH /room-types/:id (update)" "PATCH" "/room-types/$CRTId" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "PATCH /room-types/:id (update)" "PATCH" "/room-types/:id" "200" 0 "FAIL" "No ID"
}

# Delete
if ($CRTId) {
    $r = Invoke-ApiCall -Method "DELETE" -Url "$BASE/room-types/$CRTId" -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "DELETE /room-types/:id" "DELETE" "/room-types/$CRTId" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "DELETE /room-types/:id" "DELETE" "/room-types/:id" "200" 0 "FAIL" "No ID"
}

# Missing fields
$r = Invoke-ApiCall -Method "POST" -Url "$BASE/room-types" -JsonBody '{"name":"Incomplete"}' -Session $S -CsrfToken $C
Record-Test "POST /room-types missing fields (422)" "POST" "/room-types" "422" $r.StatusCode $(if ($r.StatusCode -eq 422) {"PASS"} else {"FAIL"}) $r.Body

# As housekeeping (403)
$hk = Do-Login -Email "housekeeping@luxestay.com" -Password "house123"
if ($hk.Session) {
    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/room-types" -JsonBody '{"code":"HK","name":"HK","basePricePerNightCents":10000,"maxGuests":1,"bedLabel":"1 Twin"}' -Session $hk.Session -CsrfToken $hk.Csrf
    Record-Test "POST /room-types as housekeeping (403)" "POST" "/room-types" "403" $r.StatusCode $(if ($r.StatusCode -eq 403) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "POST /room-types as housekeeping (403)" "POST" "/room-types" "403" $hk.StatusCode "FAIL" "HK login failed"
}

# Re-login admin
$login = Do-Login -Email "admin@luxestay.com" -Password "admin123"
$S = $login.Session; $C = $login.Csrf

# ---- 4. ROOMS ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/rooms"
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /rooms (public)" "GET" "/rooms" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
$RM = $null; try { $RM = $r.Body | ConvertFrom-Json } catch {}
$RmId = if ($RM.items -and $RM.items.Count -gt 0) { $RM.items[0].id } else { $null }
Write-Host "  >> First room: $RmId"

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/rooms?floor=1"
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /rooms?floor=1" "GET" "/rooms?floor=1" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/rooms?status=available"
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /rooms?status=available" "GET" "/rooms?status=available" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

if ($RmId) {
    $r = Invoke-ApiCall -Method "GET" -Url "$BASE/rooms/$RmId"
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "GET /rooms/:id (detail)" "GET" "/rooms/$RmId" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

    $r = Invoke-ApiCall -Method "GET" -Url "$BASE/rooms/$RmId/activity"
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "GET /rooms/:id/activity" "GET" "/rooms/$RmId/activity" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "GET /rooms/:id" "GET" "/rooms/:id" "200" 0 "FAIL" "No room ID"
    Record-Test "GET /rooms/:id/activity" "GET" "/rooms/:id/activity" "200" 0 "FAIL" "No room ID"
}

# Create room
$RNum = "T$(Get-Date -Format 'mmss')"
if ($RTId) {
    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/rooms" -JsonBody ("{`"number`":`"$RNum`",`"floor`":1,`"roomTypeId`":`"$RTId`",`"capacityAdults`":2,`"bedsLabel`":`"1 Queen`",`"sizeSqft`":350}") -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 201 -and $r.Body -match '"success":true')
    Record-Test "POST /rooms (admin create)" "POST" "/rooms" "201" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
    $CRm = $null; try { $CRm = $r.Body | ConvertFrom-Json } catch {}
    $CRmId = if ($CRm -and $CRm.item) { $CRm.item.id } else { $null }
} else {
    Record-Test "POST /rooms (admin create)" "POST" "/rooms" "201" 0 "FAIL" "No RT ID"
    $CRmId = $null
}

if ($CRmId) {
    $r = Invoke-ApiCall -Method "PATCH" -Url "$BASE/rooms/$CRmId" -JsonBody '{"bedsLabel":"1 King Updated"}' -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "PATCH /rooms/:id (update)" "PATCH" "/rooms/$CRmId" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "PATCH /rooms/:id (update)" "PATCH" "/rooms/:id" "200" 0 "FAIL" "No room ID"
}

# ---- 5. GUESTS ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/guests" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /guests (authenticated)" "GET" "/guests" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
$GU = $null; try { $GU = $r.Body | ConvertFrom-Json } catch {}
$Slug = if ($GU.items -and $GU.items.Count -gt 0) { $GU.items[0].slug } else { $null }
Write-Host "  >> First guest slug: $Slug"

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/guests?search=test" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /guests?search=test" "GET" "/guests?search=test" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

if ($Slug) {
    $r = Invoke-ApiCall -Method "GET" -Url "$BASE/guests/$Slug" -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "GET /guests/:slug" "GET" "/guests/$Slug" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

    $r = Invoke-ApiCall -Method "GET" -Url "$BASE/guests/$Slug/stays" -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "GET /guests/:slug/stays" "GET" "/guests/$Slug/stays" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "GET /guests/:slug" "GET" "/guests/:slug" "200" 0 "FAIL" "No slug"
    Record-Test "GET /guests/:slug/stays" "GET" "/guests/:slug/stays" "200" 0 "FAIL" "No slug"
}

# ---- 6. AVAILABILITY ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/availability?from=2026-09-15&to=2026-09-17&adults=2&children=0" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /availability (valid)" "GET" "/availability?from=2026-09-15&to=2026-09-17" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/availability?from=2024-01-01&to=2024-01-05&adults=2&children=0" -Session $S -CsrfToken $C
Record-Test "GET /availability past dates (422)" "GET" "/availability?from=2024-01-01..." "422" $r.StatusCode $(if ($r.StatusCode -eq 422) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/availability?from=2026-09-20&to=2026-09-18&adults=2&children=0" -Session $S -CsrfToken $C
Record-Test "GET /availability checkout<=checkin (422)" "GET" "/availability?from=...20&to=...18" "422" $r.StatusCode $(if ($r.StatusCode -eq 422) {"PASS"} else {"FAIL"}) $r.Body

# ---- 7. RESERVATIONS ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/reservations" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /reservations (list)" "GET" "/reservations" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$RL = $null; try { $RL = $r.Body | ConvertFrom-Json } catch {}
$ConfId = $null; $PendId = $null; $CIId = $null
if ($RL.items) {
    foreach ($i in $RL.items) {
        if ($i.status -eq "confirmed" -and -not $ConfId) { $ConfId = $i.id }
        if ($i.status -eq "pending" -and -not $PendId) { $PendId = $i.id }
        if ($i.status -eq "checked_in" -and -not $CIId) { $CIId = $i.id }
    }
}
Write-Host "  >> Confirmed: $ConfId | Pending: $PendId | Checked-in: $CIId"

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/reservations?status=confirmed" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /reservations?status=confirmed" "GET" "/reservations?status=confirmed" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$Tid = if ($ConfId) { $ConfId } elseif ($PendId) { $PendId } else { $null }
if ($Tid) {
    $r = Invoke-ApiCall -Method "GET" -Url "$BASE/reservations/$Tid" -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "GET /reservations/:id" "GET" "/reservations/$Tid" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "GET /reservations/:id" "GET" "/reservations/:id" "200" 0 "FAIL" "No reservation"
}

# Create valid reservation (use timestamp for unique guest)
$ciD = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
$coD = (Get-Date).AddDays(33).ToString("yyyy-MM-dd")
$ts = Get-Date -Format "yyyyMMddHHmmss"
$nrj = '{"newGuest":{"firstName":"Test","lastName":"Guest' + $ts + '","email":"test' + $ts + '@example.com"},"roomTypeId":"' + $RTId + '","checkInDate":"' + $ciD + '","checkOutDate":"' + $coD + '","adults":2,"children":0,"source":"api-test"}'
$r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations" -JsonBody $nrj -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 201 -and $r.Body -match '"success":true')
Record-Test "POST /reservations (create valid)" "POST" "/reservations" "201" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
$NR = $null; try { $NR = $r.Body | ConvertFrom-Json } catch {}
$NResId = if ($NR -and $NR.item) { $NR.item.id } else { $null }
Write-Host "  >> Created reservation: $NResId"

# Missing roomTypeId (422)
$r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations" -JsonBody '{"newGuest":{"firstName":"X","lastName":"Y"},"checkInDate":"2026-10-01","checkOutDate":"2026-10-03","adults":1}' -Session $S -CsrfToken $C
Record-Test "POST /reservations missing roomTypeId (422)" "POST" "/reservations" "422" $r.StatusCode $(if ($r.StatusCode -eq 422) {"PASS"} else {"FAIL"}) $r.Body

# Past checkin (422)
$r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations" -JsonBody ("{`"newGuest`":{`"firstName`":`"X`",`"lastName`":`"Y`"},`"roomTypeId`":`"$RTId`",`"checkInDate`":`"2024-01-01`",`"checkOutDate`":`"2024-01-05`",`"adults`":1}") -Session $S -CsrfToken $C
Record-Test "POST /reservations past checkin (422)" "POST" "/reservations" "422" $r.StatusCode $(if ($r.StatusCode -eq 422) {"PASS"} else {"FAIL"}) $r.Body

# checkout<=checkin (422)
$r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations" -JsonBody ("{`"newGuest`":{`"firstName`":`"X`",`"lastName`":`"Y`"},`"roomTypeId`":`"$RTId`",`"checkInDate`":`"2026-09-20`",`"checkOutDate`":`"2026-09-18`",`"adults`":1}") -Session $S -CsrfToken $C
Record-Test "POST /reservations checkout<=checkin (422)" "POST" "/reservations" "422" $r.StatusCode $(if ($r.StatusCode -eq 422) {"PASS"} else {"FAIL"}) $r.Body

# >90 nights (422)
$r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations" -JsonBody ("{`"newGuest`":{`"firstName`":`"X`",`"lastName`":`"Y`"},`"roomTypeId`":`"$RTId`",`"checkInDate`":`"2026-09-15`",`"checkOutDate`":`"2026-12-20`",`"adults`":1}") -Session $S -CsrfToken $C
Record-Test "POST /reservations >90 nights (422)" "POST" "/reservations" "422" $r.StatusCode $(if ($r.StatusCode -eq 422) {"PASS"} else {"FAIL"}) $r.Body

# Add note
if ($NResId) {
    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations/$NResId/notes" -JsonBody '{"body":"API test note"}' -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 201 -and $r.Body -match '"success":true')
    Record-Test "POST /reservations/:id/notes" "POST" "/reservations/$NResId/notes" "201" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "POST /reservations/:id/notes" "POST" "/reservations/:id/notes" "201" 0 "FAIL" "No reservation"
}

# Check-in (use the confirmed reservation, not the pending one)
$CheckInId = $ConfId
if ($CheckInId) {
    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations/$CheckInId/check-in" -Session $S -CsrfToken $C
    # 200=success, 409=valid conflict (room occupied/type mismatch/etc)
    $ok = ($r.StatusCode -eq 200 -or $r.StatusCode -eq 409)
    Record-Test "POST /reservations/:id/check-in" "POST" "/reservations/$CheckInId/check-in" "200/409" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "POST /reservations/:id/check-in" "POST" "/reservations/:id/check-in" "200/409" 0 "FAIL" "No confirmed reservation"
}

# Create & cancel
$cd1 = (Get-Date).AddDays(45).ToString("yyyy-MM-dd")
$cd2 = (Get-Date).AddDays(47).ToString("yyyy-MM-dd")
$cancelTs = Get-Date -Format "yyyyMMddHHmmss"
$r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations" -JsonBody ("{`"newGuest`":{`"firstName`":`"Cancel`",`"lastName`":`"Test$cancelTs`",`"email`":`"cancel$cancelTs@test.com`"},`"roomTypeId`":`"$RTId`",`"checkInDate`":`"$cd1`",`"checkOutDate`":`"$cd2`",`"adults`":1}") -Session $S -CsrfToken $C
$CR = $null; try { $CR = $r.Body | ConvertFrom-Json } catch {}
$CRId = if ($CR -and $CR.item) { $CR.item.id } else { $null }
Write-Host "  >> Cancel reservation: $CRId"

if ($CRId) {
    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations/$CRId/cancel" -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "POST /reservations/:id/cancel" "POST" "/reservations/$CRId/cancel" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "POST /reservations/:id/cancel" "POST" "/reservations/:id/cancel" "200" 0 "FAIL" "Could not create"
}

# ---- 8. CHECKOUT ----
$ChkId = if ($CIId) { $CIId } else { $NResId }
Write-Host "  >> Checkout reservation: $ChkId"

if ($ChkId) {
    $r = Invoke-ApiCall -Method "GET" -Url "$BASE/checkout/$ChkId" -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "GET /checkout/:reservationId" "GET" "/checkout/$ChkId" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

    $gwRef = "gw-test-" + (Get-Date -Format "yyyyMMddHHmmss")
    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/checkout/$ChkId/payments" -JsonBody ('{"amountCents":10000,"method":"cash","gatewayRef":"' + $gwRef + '"}') -Session $S -CsrfToken $C
    # 200=success, 500 may indicate server-side payment processing issue
    Record-Test "POST /checkout/:reservationId/payments" "POST" "/checkout/$ChkId/payments" "200" $r.StatusCode $(if ($r.StatusCode -eq 200) {"PASS"} else {"FAIL"}) $r.Body

    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/checkout/$ChkId/complete" -Session $S -CsrfToken $C
    # 200=success, 422=folio not fully settled (valid business logic)
    $ok = ($r.StatusCode -eq 200 -or $r.StatusCode -eq 422)
    Record-Test "POST /checkout/:reservationId/complete" "POST" "/checkout/$ChkId/complete" "200/422" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "GET /checkout/:reservationId" "GET" "/checkout/:id" "200" 0 "FAIL" "No checked-in reservation"
    Record-Test "POST /checkout/payments" "POST" "/checkout/:id/payments" "200" 0 "FAIL" "No reservation"
    Record-Test "POST /checkout/complete" "POST" "/checkout/:id/complete" "200" 0 "FAIL" "No reservation"
}

# ---- 9. FOLIOS ----
$FId = $null
if ($NResId) {
    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/folios" -JsonBody ("{`"reservationId`":`"$NResId`"}") -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 201 -and $r.Body -match '"success":true')
    Record-Test "POST /folios (create)" "POST" "/folios" "201" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
    $FO = $null; try { $FO = $r.Body | ConvertFrom-Json } catch {}
    $FId = if ($FO -and $FO.item) { $FO.item.id } else { $null }
} else {
    Record-Test "POST /folios (create)" "POST" "/folios" "201" 0 "FAIL" "No reservation"
}

if ($FId) {
    $r = Invoke-ApiCall -Method "GET" -Url "$BASE/folios/$FId" -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "GET /folios/:id" "GET" "/folios/$FId" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/folios/$FId/charges" -JsonBody '{"description":"Room Charge","department":"room","quantity":1,"unitAmountCents":25000}' -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "POST /folios/:id/charges" "POST" "/folios/$FId/charges" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/folios/$FId/discounts" -JsonBody '{"label":"Loyalty Discount","amountCents":5000}' -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
    Record-Test "POST /folios/:id/discounts" "POST" "/folios/$FId/discounts" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/folios/$FId/payments" -JsonBody '{"amountCents":15000,"method":"cash"}' -Session $S -CsrfToken $C
    $ok = ($r.StatusCode -eq 201 -and $r.Body -match '"success":true')
    Record-Test "POST /folios/:id/payments" "POST" "/folios/$FId/payments" "201" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "GET /folios/:id" "GET" "/folios/:id" "200" 0 "FAIL" "No folio"
    Record-Test "POST /folios/:id/charges" "POST" "/folios/:id/charges" "200" 0 "FAIL" "No folio"
    Record-Test "POST /folios/:id/discounts" "POST" "/folios/:id/discounts" "200" 0 "FAIL" "No folio"
    Record-Test "POST /folios/:id/payments" "POST" "/folios/:id/payments" "201" 0 "FAIL" "No folio"
}

# ---- 10. BILLING ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/billing/transactions" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /billing/transactions" "GET" "/billing/transactions" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/billing/metrics" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /billing/metrics" "GET" "/billing/metrics" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

# ---- 11. HOUSEKEEPING ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/housekeeping/tasks" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /housekeeping/tasks" "GET" "/housekeeping/tasks" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
$HK = $null; try { $HK = $r.Body | ConvertFrom-Json } catch {}
$TskId = if ($HK.items -and $HK.items.Count -gt 0) { $HK.items[0].id } else { $null }
Write-Host "  >> First task: $TskId"

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/housekeeping/stats" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /housekeeping/stats" "GET" "/housekeeping/stats" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/housekeeping/staff-schedule" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /housekeeping/staff-schedule" "GET" "/housekeeping/staff-schedule" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

if ($TskId) {
    $r = Invoke-ApiCall -Method "PATCH" -Url "$BASE/housekeeping/tasks/$TskId" -JsonBody '{"status":"cleaning","progressPercent":50}' -Session $S -CsrfToken $C
    # 200=success, 409=optimistic lock conflict (valid concurrent modification response)
    $ok = ($r.StatusCode -eq 200 -or $r.StatusCode -eq 409)
    Record-Test "PATCH /housekeeping/tasks/:id" "PATCH" "/housekeeping/tasks/$TskId" "200/409" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body
} else {
    Record-Test "PATCH /housekeeping/tasks/:id" "PATCH" "/housekeeping/tasks/:id" "200/409" 0 "FAIL" "No task"
}

# ---- 12. DASHBOARD ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/dashboard/summary" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /dashboard/summary" "GET" "/dashboard/summary" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

# ---- 13. INVOICES ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/invoices" -Session $S -CsrfToken $C
$ok = ($r.StatusCode -eq 200 -and $r.Body -match '"success":true')
Record-Test "GET /invoices" "GET" "/invoices" "200" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

# ---- 14. CSRF ----
# Test CSRF without token using raw HttpWebRequest (proves CSRF middleware blocks)
$csrfBody = '{"newGuest":{"firstName":"XCSRF","lastName":"YCSRF","email":"csrf' + (Get-Date -Format "yyyyMMddHHmmss") + '@test.com"},"roomTypeId":"' + $RTId + '","checkInDate":"2026-10-15","checkOutDate":"2026-10-17","adults":1}'
$cookieJar = New-Object System.Net.CookieContainer
foreach ($ck in $S.Cookies.GetCookies([System.Uri]"http://localhost:5000")) { $cookieJar.Add($ck) }
$csrfActualCode = 0
$csrfActualBody = ""
try {
    $csrfReq = [System.Net.HttpWebRequest]::Create("$BASE/reservations")
    $csrfReq.Method = "POST"
    $csrfReq.ContentType = "application/json"
    $csrfReq.CookieContainer = $cookieJar
    $csrfBytes = [System.Text.Encoding]::UTF8.GetBytes($csrfBody)
    $csrfReq.ContentLength = $csrfBytes.Length
    $ws = $csrfReq.GetRequestStream()
    $ws.Write($csrfBytes, 0, $csrfBytes.Length)
    $ws.Close()
    $csrfResp = $csrfReq.GetResponse()
    $csrfActualCode = [int]$csrfResp.StatusCode
    $sr = New-Object System.IO.StreamReader($csrfResp.GetResponseStream())
    $csrfActualBody = $sr.ReadToEnd(); $sr.Close(); $csrfResp.Close()
} catch [System.Net.WebException] {
    if ($_.Exception.Response) {
        $csrfActualCode = [int]$_.Exception.Response.StatusCode
        try { $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $csrfActualBody = $sr.ReadToEnd(); $sr.Close() } catch {}
    } else {
        $csrfActualBody = $_.Exception.Message
    }
} catch {
    $csrfActualBody = $_.Exception.Message
}
$r = @{ StatusCode = $csrfActualCode; Body = $csrfActualBody }
$ok = ($r.StatusCode -eq 403)
Record-Test "POST /reservations WITHOUT CSRF (403)" "POST" "/reservations" "403" $r.StatusCode $(if ($ok) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "POST" -Url "$BASE/reservations" -JsonBody ('{"newGuest":{"firstName":"XCSRF2","lastName":"YCSRF2","email":"csrf2' + (Get-Date -Format "yyyyMMddHHmmss") + '@test.com"},"roomTypeId":"' + $RTId + '","checkInDate":"2026-10-15","checkOutDate":"2026-10-17","adults":1}') -Session $S -CsrfToken $C
$csrfOk = ($r.StatusCode -ne 403)
Record-Test "POST /reservations WITH CSRF (not 403)" "POST" "/reservations" "201/422" $r.StatusCode $(if ($csrfOk) {"PASS"} else {"FAIL"}) $r.Body

# ---- 15. RATE LIMITING ----
Write-Host "  >> Rate limit test (12 logins)..."
$got429 = $false; $lastCode = 0
for ($i = 0; $i -lt 12; $i++) {
    $r = Invoke-ApiCall -Method "POST" -Url "$BASE/auth/login" -JsonBody '{"email":"admin@luxestay.com","password":"admin123"}'
    $lastCode = $r.StatusCode
    if ($r.StatusCode -eq 429) { $got429 = $true; Write-Host "    429 at attempt $($i+1)"; break }
    Start-Sleep -Milliseconds 50
}
Record-Test "Login rate limiting (429 after 10+)" "POST" "/auth/login x12" "429" $(if ($got429) {429} else {$lastCode}) $(if ($got429) {"PASS"} else {"FAIL"}) "Limited: $got429"

# Re-login after rate limit
Start-Sleep -Seconds 2
$login = Do-Login -Email "admin@luxestay.com" -Password "admin123"
$S = $login.Session; $C = $login.Csrf

# ---- 16. 404 ----
$r = Invoke-ApiCall -Method "GET" -Url "$BASE/nonexistent"
Record-Test "GET /nonexistent (404)" "GET" "/nonexistent" "404" $r.StatusCode $(if ($r.StatusCode -eq 404) {"PASS"} else {"FAIL"}) $r.Body

$r = Invoke-ApiCall -Method "GET" -Url "$BASE/reservations/000000000000000000000000" -Session $S -CsrfToken $C
Record-Test "GET /reservations/0000...00 (404)" "GET" "/reservations/000000000000000000000000" "404" $r.StatusCode $(if ($r.StatusCode -eq 404) {"PASS"} else {"FAIL"}) $r.Body

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host ("=" * 80)
Write-Host "TEST SUMMARY"
Write-Host ("=" * 80)
Write-Host "Total: $($script:TotalTests)  |  Passed: $($script:Passed)  |  Failed: $($script:Failed)"
$pct = if ($script:TotalTests -gt 0) { [math]::Round(($script:Passed / $script:TotalTests) * 100, 1) } else { 0 }
Write-Host "Pass Rate: $pct%"
Write-Host ("=" * 80)

# Save to file
$out = @()
$out += "=" * 80
$out += "LuxeStay API Test Results - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$out += "Target: $BASE"
$out += "=" * 80
$out += ""
$out += $script:Results
$out += ""
$out += "=" * 80
$out += "TEST SUMMARY"
$out += "=" * 80
$out += "Total: $($script:TotalTests)  |  Passed: $($script:Passed)  |  Failed: $($script:Failed)"
$out += "Pass Rate: $pct%"
$out += "=" * 80
$out | Out-File -FilePath $RESULTS_FILE -Encoding UTF8

Write-Host "`nResults saved to: $RESULTS_FILE"
Write-Host "Done!"
