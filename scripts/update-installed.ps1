param(
  [string]$TargetDirectory = '',
  [string]$BackupRoot = '',
  [string]$DataDirectory = '',
  [switch]$RenameLegacyPackage,
  [switch]$CheckOnly,
  [string]$ProfileName = 'desktop'
)
$ErrorActionPreference = 'Stop'
$source = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$diaryHome = if ($env:DSH_HOME) { [IO.Path]::GetFullPath($env:DSH_HOME) } else { Join-Path $env:USERPROFILE '.dsh' }
function Resolve-PluginDirectory([string]$Path) {
  $cursor = [IO.Path]::GetFullPath($Path)
  $seen = @{}
  for ($depth = 0; $depth -lt 16; $depth++) {
    if ($seen.ContainsKey($cursor)) { throw "Circular installed directory link: $Path" }
    $seen[$cursor] = $true
    $item = Get-Item -LiteralPath $cursor -Force
    if (-not $item.PSIsContainer) { throw "Plugin path is not a directory: $cursor" }
    if (-not ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { return $item.FullName.TrimEnd('\') }
    $destinations = @($item.Target)
    if ($destinations.Count -ne 1 -or -not $destinations[0]) { throw "Cannot resolve installed directory link: $cursor" }
    $destination = [string]$destinations[0]
    $cursor = [IO.Path]::GetFullPath($(if ([IO.Path]::IsPathRooted($destination)) { $destination } else { Join-Path $item.Parent.FullName $destination }))
  }
  throw "Installed directory link chain is too long: $Path"
}
if (-not $TargetDirectory) {
  if (-not $ProfileName -or $ProfileName -in @('.', '..') -or $ProfileName -match '[\\/:]') { throw 'Invalid profile name.' }
  $profileDirectory = Join-Path $diaryHome ('profiles\' + $ProfileName)
  $profileManifest = Join-Path $profileDirectory 'package.json'
  $candidates = @()
  if (Test-Path -LiteralPath $profileManifest -PathType Leaf) {
    $profileConfig = Get-Content -LiteralPath $profileManifest -Raw | ConvertFrom-Json
    foreach ($packageName in @('dsh-yuyudiary', 'dsh-yuyu-diary')) {
      $spec = $profileConfig.dependencies.$packageName
      if (-not $spec -and $packageName -notin @($profileConfig.dsh.profile.bundles)) { continue }
      $entry = Join-Path $profileDirectory ('node_modules\' + $packageName)
      if (Test-Path -LiteralPath (Join-Path $entry 'package.json') -PathType Leaf) {
        $candidates += Resolve-PluginDirectory $entry
      } elseif ($spec -match '^(file|link):(.+)$') {
        $localPath = $Matches[2]
        if (-not [IO.Path]::IsPathRooted($localPath)) { $localPath = Join-Path $profileDirectory $localPath }
        if (-not (Test-Path -LiteralPath (Join-Path $localPath 'package.json') -PathType Leaf)) { throw "Profile plugin source is missing; specify -TargetDirectory: $localPath" }
        $candidates += Resolve-PluginDirectory $localPath
      } else { throw "Profile plugin entry is missing; specify -TargetDirectory: $packageName" }
    }
  }
  # The selected profile is authoritative. Only use conventional paths when it has no record.
  if (-not $candidates.Count) {
    foreach ($folder in @('dsh-yuyudiary', 'dsh-yuyu-diary')) {
      $candidate = Join-Path $diaryHome ('plugins\' + $folder)
      if (Test-Path -LiteralPath (Join-Path $candidate 'package.json') -PathType Leaf) { $candidates += Resolve-PluginDirectory $candidate }
    }
  }
  $candidates = @($candidates | Sort-Object -Unique)
  if ($candidates.Count -gt 1) { throw 'Multiple plugin directories found; specify -TargetDirectory to select one.' }
  if (-not $candidates.Count) { throw 'Installed plugin not found. Check -ProfileName or specify -TargetDirectory.' }
  $TargetDirectory = $candidates[0]
}
$target = Resolve-PluginDirectory $TargetDirectory
Write-Output "Installed plugin directory: $target"
if (-not (Test-Path -LiteralPath (Join-Path $target 'package.json') -PathType Leaf)) { throw 'Installed plugin not found; this updater only updates an existing installation.' }
$manifest = Get-Content -LiteralPath (Join-Path $source 'package.json') -Raw | ConvertFrom-Json
$installed = Get-Content -LiteralPath (Join-Path $target 'package.json') -Raw | ConvertFrom-Json
$legacyRename = $RenameLegacyPackage -and $installed.name -eq 'dsh-yuyu-diary'
if ($manifest.name -ne 'dsh-yuyudiary' -or ($installed.name -ne $manifest.name -and -not $legacyRename)) { throw 'Wrong package directory.' }
if ($source -eq $target) { Write-Output 'Source and installed directory are identical; restart DSH to reload.'; return }
if ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Installed directory is a link. Resolve its actual source before updating.' }
foreach ($dependency in @('@deepseek-ai/cordis','@deepseek-ai/schemastery','@deepseek-ai/dsh-typert-protocol')) {
  if (-not $manifest.peerDependencies.$dependency -or $manifest.peerDependenciesMeta.$dependency.optional -ne $true) { throw "Missing optional runtime peer: $dependency" }
}
$allowedFiles = @('package.json','cordis.patch.yml','index.js','core.js','ui-model.js','doodles.js','persona.js','storage.js','engine.js','generation.js','data-location.js','client.js','client.template.js','diary.css','icon.svg','README.md','PERSONA.md','IMAGE-PROMPT.md','VERIFICATION.md','THIRD_PARTY_NOTICES.md','LICENSE')
$items = @()
foreach ($line in Get-Content -LiteralPath (Join-Path $source 'SHA256SUMS.txt')) {
  if (-not $line.Trim()) { continue }
  if ($line -notmatch '^([a-fA-F0-9]{64})  (.+)$') { throw 'Malformed release checksum.' }
  $expected = $Matches[1]; $relative = $Matches[2].Replace('/', '\')
  $segments = $relative.Split('\')
  if ([IO.Path]::IsPathRooted($relative) -or $segments -contains '..' -or $segments -contains '.' -or $relative.Contains(':')) { throw 'Unsafe release path.' }
  if ($relative -notin $allowedFiles -and $segments[0] -notin @('assets','locale','scripts','tests')) { throw "Unexpected release path: $relative" }
  $from = [IO.Path]::GetFullPath((Join-Path $source $relative))
  $to = [IO.Path]::GetFullPath((Join-Path $target $relative))
  if (-not $from.StartsWith($source + '\', [StringComparison]::OrdinalIgnoreCase) -or -not $to.StartsWith($target + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'File escaped plugin directory.' }
  foreach ($candidate in @($from, $to)) {
    $cursor = $candidate
    while ($cursor -and $cursor -ne $source -and $cursor -ne $target) {
      if ((Test-Path -LiteralPath $cursor) -and ((Get-Item -LiteralPath $cursor).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Linked file or folder: $cursor" }
      $cursor = Split-Path -Parent $cursor
    }
  }
  if ((Get-FileHash -LiteralPath $from -Algorithm SHA256).Hash -ne $expected) { throw "Source checksum mismatch: $relative" }
  $items += [pscustomobject]@{ Relative = $relative; From = $from; To = $to; Hash = $expected }
}
if ($items.Count -lt 10 -or 'client.js' -notin $items.Relative -or 'package.json' -notin $items.Relative) { throw 'Incomplete release manifest.' }
$items += [pscustomobject]@{ Relative = 'SHA256SUMS.txt'; From = (Join-Path $source 'SHA256SUMS.txt'); To = (Join-Path $target 'SHA256SUMS.txt'); Hash = (Get-FileHash -LiteralPath (Join-Path $source 'SHA256SUMS.txt')).Hash }
$changed = @($items | Where-Object { -not (Test-Path -LiteralPath $_.To) -or (Get-FileHash -LiteralPath $_.To).Hash -ne $_.Hash })
if ($CheckOnly) { Write-Output "Validated $($items.Count) release files; $($changed.Count) installed files would change. No files written."; return }
if ($changed.Count -eq 0) { Write-Output "Installed plugin already matches $($manifest.version)."; return }
if (-not $BackupRoot) { $BackupRoot = Join-Path $diaryHome 'backups\dsh-yuyudiary\updates' }
$backup = Join-Path ([IO.Path]::GetFullPath($BackupRoot)) ("before-" + $manifest.version + '-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff') + '-' + [Guid]::NewGuid().ToString('N').Substring(0,6))
# Snapshot live data before replacing program files. Exclude locks, temporary files and nested backups.
$dataRoot = if ($DataDirectory) { [IO.Path]::GetFullPath($DataDirectory) } else { Join-Path $diaryHome 'data\dsh-yuyudiary' }
if (-not $DataDirectory -and -not (Test-Path -LiteralPath $dataRoot) -and (Test-Path -LiteralPath (Join-Path $target 'data'))) { $dataRoot = Join-Path $target 'data' }
$dataFiles = @('state.json','bookmarks.json')
$entryRoot = Join-Path $dataRoot 'entries'
if (Test-Path -LiteralPath $entryRoot -PathType Container) {
  $dataFiles += @(Get-ChildItem -LiteralPath $entryRoot -File -Filter '*.json' | Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}\.json$' } | ForEach-Object { 'entries\' + $_.Name })
}
foreach ($relative in $dataFiles) {
  $from = Join-Path $dataRoot $relative
  if (-not (Test-Path -LiteralPath $from -PathType Leaf)) { continue }
  $saved = Join-Path $backup ('data\' + $relative)
  New-Item -ItemType Directory -Path (Split-Path -Parent $saved) -Force | Out-Null
  $stable = $false
  for ($attempt = 0; $attempt -lt 3; $attempt++) {
    $before = (Get-FileHash -LiteralPath $from).Hash
    Copy-Item -LiteralPath $from -Destination $saved -Force
    $copied = (Get-FileHash -LiteralPath $saved).Hash
    $after = (Get-FileHash -LiteralPath $from).Hash
    if ($before -eq $copied -and $copied -eq $after) { $stable = $true; break }
  }
  if (-not $stable) { throw "Data is changing too quickly to back up; no program files were updated: $relative" }
}
# Back up every replaced file first. Daily data and profile configuration are outside this allowlist.
foreach ($item in $changed) {
  if (Test-Path -LiteralPath $item.To) {
    $saved = Join-Path $backup $item.Relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $saved) -Force | Out-Null
    Copy-Item -LiteralPath $item.To -Destination $saved
  }
}
# Copy the version manifest last so a failed copy does not advertise a completed update.
foreach ($item in ($changed | Sort-Object @{ Expression = { $_.Relative -eq 'package.json' } })) {
  New-Item -ItemType Directory -Path (Split-Path -Parent $item.To) -Force | Out-Null
  Copy-Item -LiteralPath $item.From -Destination $item.To -Force
  if ((Get-FileHash -LiteralPath $item.To).Hash -ne $item.Hash) { throw "Update verification failed: $($item.Relative). Backup: $backup" }
}
Write-Output "Updated and verified $($changed.Count) files to version $($manifest.version). Backup: $backup"
Write-Output 'Restart DSH to load this update. Diary data was backed up and was not overwritten.'
