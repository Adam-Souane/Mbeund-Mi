param($src,$pdf)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
try {
  $d = $w.Documents.Open($src, $false, $false)
  $d.Fields.Update() | Out-Null
  foreach ($t in $d.TablesOfContents) { $t.Update() | Out-Null }
  $d.Save(); $d.ExportAsFixedFormat($pdf, 17); $d.Close($false)
} finally { $w.Quit() }
