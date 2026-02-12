<#
.SYNOPSIS
    Tests critical API routes for Skillsync locally.

.DESCRIPTION
    Runs a series of tests against the local Next.js server to verify:
    1. Auth connectivity
    2. Database connectivity
    3. Profile read/write
    4. Resume upload
    5. Sandbox analysis

.PARAMETER SessionCookie
    The 'projects.skillsync.session-token' cookie value from a logged-in session.
    REQUIRED.

.PARAMETER BaseUrl
    The base URL of the local server. Defaults to 'http://localhost:3000'.

.EXAMPLE
    .\test-before-deploy.ps1 -SessionCookie "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..release"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SessionToken,

    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [string]$Body = $null,
        [string]$ContentType = "application/json",
        [hashtable]$FormFields = $null,
        [string]$FilePath = $null
    )

    Write-Host "[$Name] Testing $Method $Path..." -NoNewline

    # Create WebSession for reliable cookie handling
    $Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $Cookie = New-Object System.Net.Cookie
    $Cookie.Name = "next-auth.session-token"
    $Cookie.Value = $SessionToken
    $Cookie.Domain = "localhost" # Adjust if needed, or parse from BaseUrl
    $Session.Cookies.Add($Cookie)
    
    $Headers = @{
        # Cookie header is handled by WebSession now
    }

    try {
        $Uri = "$BaseUrl$Path"
        $Response = $null

        if ($FilePath) {
            # Multipart form data for file upload
            $ParsedPath = Resolve-Path $FilePath
            $FileBytes = [System.IO.File]::ReadAllBytes($ParsedPath)
            $Boundary = [System.Guid]::NewGuid().ToString()
            $LF = "`r`n"

            $MemoryStream = [System.IO.MemoryStream]::new()
            $Writer = [System.IO.StreamWriter]::new($MemoryStream)

            # File part
            $Writer.Write("--$Boundary$LF")
            $Writer.Write("Content-Disposition: form-data; name=`"file`"; filename=`"$(Split-Path $FilePath -Leaf)`"$LF")
            $Writer.Write("Content-Type: application/pdf$LF$LF")
            $Writer.Flush()
            $MemoryStream.Write($FileBytes, 0, $FileBytes.Length)
            $Writer.Write("$LF")

            # Form fields
            if ($FormFields) {
                foreach ($Key in $FormFields.Keys) {
                    $Writer.Write("--$Boundary$LF")
                    $Writer.Write("Content-Disposition: form-data; name=`"$Key`"$LF$LF")
                    $Writer.Write($FormFields[$Key] + "$LF")
                }
            }

            $Writer.Write("--$Boundary--$LF")
            $Writer.Flush()

            $BodyBytes = $MemoryStream.ToArray()
            
            $Response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -WebSession $Session -ContentType "multipart/form-data; boundary=$Boundary" -Body $BodyBytes -ErrorAction Stop
        }
        elseif ($Body) {
            $Response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -WebSession $Session -ContentType $ContentType -Body $Body -ErrorAction Stop
        }
        else {
            $Response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -WebSession $Session -ErrorAction Stop
        }

        try {
            $Json = $Response.Content | ConvertFrom-Json
        } catch {
            Write-Host " FAIL (Parse Error)" -ForegroundColor Red
            if ($Response.Content.TrimStart().StartsWith("<")) {
                Write-Host "   -> Server returned HTML instead of JSON. This is likely an AUTH REDIRECT to /login." -ForegroundColor Yellow
                Write-Host "   -> CHECK YOUR SESSION TOKEN. It may be expired." -ForegroundColor Yellow
            } else {
                Write-Host "   -> Response could not be parsed as JSON." -ForegroundColor Yellow
                Write-Host "   -> Raw: $($Response.Content)" -ForegroundColor Gray
            }
            return $null
        }

        if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 300) {
            Write-Host " PASS" -ForegroundColor Green
            return $Json
        } else {
            Write-Host " FAIL ($($Response.StatusCode))" -ForegroundColor Red
            if ($Json.error) {
                Write-Host "   -> Error: $($Json.error)" -ForegroundColor Yellow
            }
            return $null
        }
    }
    catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)"
        
        # Try to read the error response body
        if ($_.Exception.Response) {
             # Read weird stream from PS error response
             $Stream = $_.Exception.Response.GetResponseStream()
             if ($Stream.CanRead) {
                $Reader = [System.IO.StreamReader]::new($Stream)
                $ErrBody = $Reader.ReadToEnd()
                Write-Host "Details: $ErrBody" -ForegroundColor Yellow
                
                # Setup $Json for the error case if it's JSON
                if ($ErrBody.StartsWith("{")) {
                     try {
                        # We don't return here, just print it. Test is already failed.
                        $ErrJson = $ErrBody | ConvertFrom-Json
                        if ($ErrJson.error) { Write-Host "   -> Server Msg: $($ErrJson.error)" -ForegroundColor Yellow }
                     } catch {}
                }
             }
        }
        return $null
    }
}

Write-Host "Starting Pre-Deployment Tests..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host "--------------------------------"

# 1. Auth & Connectivity (via Stats)
$Stats = Test-Endpoint -Name "Connectivity Check" -Method "GET" -Path "/api/student/dashboard/stats"
if ($Stats.success -eq $true) {
    Write-Host "   > Active Drives: $($Stats.data.activeDrivesCount)" -ForegroundColor Gray
    Write-Host "   > Rankings: $($Stats.data.rankingsCount)" -ForegroundColor Gray
}

# 2. Profile Read
$Profile = Test-Endpoint -Name "Read Profile" -Method "GET" -Path "/api/student/profile"
if ($Profile.success -eq $true) {
    Write-Host "   > User: $($Profile.data.user.name)" -ForegroundColor Gray
    Write-Host "   > Completeness: $($Profile.data.profile.profileCompleteness)%" -ForegroundColor Gray
}

# 3. Profile Update (Onboarding Simulation)
$UpdatePayload = @{
    skills = @(
        @{ name = "Java"; proficiency = 4; category = "Language" },
        @{ name = "Spring Boot"; proficiency = 3; category = "Framework" },
        @{ name = "Testing"; proficiency = 3; category = "Skill" }
    )
    linkedin = "https://linkedin.com/in/testuser"
} | ConvertTo-Json -Depth 5

$Update = Test-Endpoint -Name "Update Profile" -Method "PATCH" -Path "/api/student/profile" -Body $UpdatePayload
if ($Update.success -eq $true) {
    Write-Host "   > New Completeness: $($Update.data.completeness)%" -ForegroundColor Gray
}

# 4. Resume Upload
# Create a dummy PDF for testing
$TestPdfPath = Join-Path $env:TEMP "test-resume.pdf"
"%PDF-1.4 test resume content" | Set-Content -Path $TestPdfPath

$Upload = Test-Endpoint -Name "Resume Upload" -Method "POST" -Path "/api/student/resume" -FilePath $TestPdfPath -FormFields @{ resumeText = "This is a extracted text from the resume for testing purposes." }
if ($Upload.success -eq $true) {
    Write-Host "   > Resume URL: $($Upload.data.url)" -ForegroundColor Gray
    Write-Host "   > Job ID: $($Upload.data.jobId)" -ForegroundColor Gray
}

# 5. Sandbox Analysis
$SandboxPayload = @{
    jdText = "We are looking for a Java Spring Boot developer with testing experience."
    minCgpa = 7.0
} | ConvertTo-Json

$Sandbox = Test-Endpoint -Name "Sandbox Analysis" -Method "POST" -Path "/api/student/sandbox" -Body $SandboxPayload
if ($Sandbox.success -eq $true) {
    Write-Host "   > Match Score: $($Sandbox.data.matchScore)" -ForegroundColor Gray
    Write-Host "   > Status: $($Sandbox.data.shortExplanation)" -ForegroundColor Gray
}

Write-Host "--------------------------------"
Write-Host "Tests Completed."
