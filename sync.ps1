
# Script para Sincronização Automática com o GitHub
Write-Host "Iniciando sincronização com o GitHub..." -ForegroundColor Cyan

# Adiciona todas as mudanças
git add .

# Verifica se há mudanças para dar commit
$status = git status --porcelain
if ($null -ne $status) {
    Write-Host "Mudanças detectadas. Realizando commit..." -ForegroundColor Yellow
    git commit -m "auto: sincronização automática $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
    
    Write-Host "Enviando para o GitHub (push)..." -ForegroundColor Green
    git push origin main
} else {
    Write-Host "Nenhuma mudança pendente para sincronização." -ForegroundColor Gray
}

Write-Host "Sincronização concluída!" -ForegroundColor Cyan
