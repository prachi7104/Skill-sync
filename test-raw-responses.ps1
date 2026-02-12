<#
.SYNOPSIS
    Diagnose API routes by showing raw responses.

.DESCRIPTION
    Makes requests to critical API endpoints and outputs the RAW response body,
    status code, and Content-Type header. useful for debugging "Invalid JSON primitive" errors.

.PARAMETER SessionToken
    The 'next-auth.session-token' cookie value. REQUIRED.

.PARAMETER BaseUrl
    The base URL of the local server. Defaults to 'http://localhost:3000'.
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SessionToken,

    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Continue" # Don't stop on error, we want to see the 404/500 body

function Test-RawEndpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [string]$Body = $null
    )

    Write-Host "`n[$Name] $Method $Path" -ForegroundColor Cyan
    Write-Host "--------------------------------------------------" -ForegroundColor DarkGray

    # Debug: Print token summary
    if ($SessionToken.Length -gt 10) {
        Write-Host "   (Token loaded: $($SessionToken.Substring(0, 5))...$($SessionToken.Substring($SessionToken.Length - 5)) - Length: $($SessionToken.Length))" -ForegroundColor DarkGray
    } else {
        Write-Host "   (Token seems invalid/empty!)" -ForegroundColor Red
    }

    $Headers = @{
        "Content-Type" = "application/json"
    }
    
    # Create WebSession for reliable cookie handling
    $Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $Cookie = New-Object System.Net.Cookie
    $Cookie.Name = "next-auth.session-token"
    $Cookie.Value = $SessionToken
    $Cookie.Domain = "localhost"
    $Session.Cookies.Add($Cookie)

    try {
        $Uri = "$BaseUrl$Path"
        $Response = $null

        if ($Body) {
            $Response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -WebSession $Session -Body $Body -ErrorAction SilentlyContinue -MaximumRedirection 0
        } else {
            $Response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -WebSession $Session -ErrorAction SilentlyContinue -MaximumRedirection 0
        }

        # Handle 4xx/5xx responses which might end up in the catch block depending on PS version/prefs,
        # but -ErrorAction SilentlyContinue usually puts them in $Response (if successful) or leaves $Response null.
        # Actually in newer PS, 4xx/5xx throws. So we check $Error[0] if $Response is null.
        
        if ($null -eq $Response) {
             # Check if it was a web exception
             if ($Error[0].Exception.Response) {
                 $Response = $Error[0].Exception.Response
             }
        }
        
        if ($null -eq $Response) {
            Write-Host "FATAL: No response received." -ForegroundColor Red
            return
        }

        # Status Code
        if ($Response.StatusCode) {
             $Color = "Green"
             if ([int]$Response.StatusCode -ge 400) { $Color = "Red" }
             Write-Host "Status Code: $($Response.StatusCode)" -ForegroundColor $Color
        }

        # Content Type
        $CT = $Response.Headers["Content-Type"]
        if ($null -eq $CT) { $CT = $Response.Headers["Content-Type"] } # PS Core vs Desktop
        Write-Host "Content-Type: $CT" -ForegroundColor Yellow

        # Check for Redirect
        if ([int]$Response.StatusCode -eq 307 -or [int]$Response.StatusCode -eq 302) {
             $Loc = $Response.Headers["Location"]
             Write-Host "REDIRECT LOCATION: $Loc" -ForegroundColor Magenta
             
             if ($Loc -match "callbackUrl=([^&]+)") {
                 $Decoded = [System.Web.HttpUtility]::UrlDecode($Matches[1])
                 Write-Host "   -> Redirecting because auth failed for: $Decoded" -ForegroundColor Magenta
             }
        }

        # Body (Safe read)
        $RawContent = ""
        if ($Response.Content) {
            $RawContent = $Response.Content
        } elseif ($Response.GetResponseStream) {
            $Stream = $Response.GetResponseStream()
            $Reader = [System.IO.StreamReader]::new($Stream)
            $RawContent = $Reader.ReadToEnd()
        }

        # Show first 500 chars
        $Preview = $RawContent
        if ($Preview.Length -gt 500) { $Preview = $Preview.Substring(0, 500) + "... (truncated)" }
        
        Write-Host "Response Body Preview:" -ForegroundColor Gray
        Write-Host $Preview
        Write-Host "--------------------------------------------------" -ForegroundColor DarkGray

    } catch {
        Write-Host "EXCEPTION: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Starting RAW Diagnostics..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"

# 1. Stats (GET)
Test-RawEndpoint -Name "Stats" -Method "GET" -Path "/api/student/dashboard/stats"

# 2. Profile (GET)
Test-RawEndpoint -Name "Profile" -Method "GET" -Path "/api/student/profile"

# 3. Resume (POST - Check 400/404)
# Sending empty body to see if it returns JSON error or HTML 404
Test-RawEndpoint -Name "Resume (Empty POST)" -Method "POST" -Path "/api/student/resume"

# 5. Auth Debugger
Test-RawEndpoint -Name "Auth Debugger" -Method "GET" -Path "/api/debug/auth"
