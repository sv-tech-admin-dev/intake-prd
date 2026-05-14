param(
  [string]$ProjectRef,
  [string]$AccessToken,
  [string]$DbPassword,
  [string]$SecretKey,
  [string]$ServiceRoleKey
)

$ErrorActionPreference = "Stop"

function Read-EnvValue {
  param(
    [string]$Path,
    [string]$Name
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  $match = Select-String -LiteralPath $Path -Pattern "^$([regex]::Escape($Name))=(.*)$" | Select-Object -First 1
  if ($null -eq $match) {
    return $null
  }

  return $match.Matches[0].Groups[1].Value.Trim()
}

function Get-SupabaseProjectRef {
  param([string]$Url)

  if ([string]::IsNullOrWhiteSpace($Url)) {
    return $null
  }

  if ($Url -match '^https://([^.]+)\.supabase\.co/?$') {
    return $Matches[1]
  }

  return $null
}

function Set-EnvFileValue {
  param(
    [string]$Path,
    [string]$Name,
    [string]$Value
  )

  $lines = @()
  if (Test-Path -LiteralPath $Path) {
    $lines = Get-Content -LiteralPath $Path
  }

  $pattern = "^$([regex]::Escape($Name))="
  $updated = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $pattern) {
      $lines[$i] = "$Name=$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $lines += "$Name=$Value"
  }

  Set-Content -LiteralPath $Path -Value $lines
}

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
  $projectUrl = Read-EnvValue -Path ".env.local" -Name "NEXT_PUBLIC_SUPABASE_URL"
  $ProjectRef = Get-SupabaseProjectRef -Url $projectUrl
}

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
  $ProjectRef = Read-Host "Supabase project ref"
}

if ([string]::IsNullOrWhiteSpace($AccessToken)) {
  $AccessToken = $env:SUPABASE_ACCESS_TOKEN
}

if ([string]::IsNullOrWhiteSpace($DbPassword)) {
  $DbPassword = $env:SUPABASE_DB_PASSWORD
}

if ([string]::IsNullOrWhiteSpace($AccessToken)) {
  $AccessToken = Read-Host "Supabase access token"
}

if ([string]::IsNullOrWhiteSpace($DbPassword)) {
  $DbPassword = Read-Host "Supabase database password"
}

if ([string]::IsNullOrWhiteSpace($SecretKey)) {
  $SecretKey = $env:SUPABASE_SECRET_KEY
}

if ([string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
  $ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
}

if ([string]::IsNullOrWhiteSpace($SecretKey) -and [string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
  $SecretKey = Read-Host "Supabase secret key (or leave blank to use legacy service role key)"
}

if (-not [string]::IsNullOrWhiteSpace($SecretKey)) {
  Set-EnvFileValue -Path ".env.local" -Name "SUPABASE_SECRET_KEY" -Value $SecretKey
}

$env:SUPABASE_ACCESS_TOKEN = $AccessToken
$env:SUPABASE_DB_PASSWORD = $DbPassword
if (-not [string]::IsNullOrWhiteSpace($SecretKey)) {
  $env:SUPABASE_SECRET_KEY = $SecretKey
}
if (-not [string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
  $env:SUPABASE_SERVICE_ROLE_KEY = $ServiceRoleKey
}

Write-Host "Linking project $ProjectRef..."
npx supabase link --project-ref $ProjectRef

Write-Host "Pushing migrations..."
npm run db:push

Write-Host "Generating database types..."
npm run db:types

Write-Host "Supabase setup complete."
