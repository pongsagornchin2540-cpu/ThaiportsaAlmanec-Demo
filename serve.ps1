param([int]$Port = 8080)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Thailand Sports Almanac: http://localhost:$Port"
python -m http.server $Port --directory $root
