@echo off
echo ========================================
echo   VERIFICACAO COMPLETA DO RAILWAY
echo ========================================
echo.

echo [1/5] Verificando status do Railway CLI...
railway --version
if %errorlevel% neq 0 (
    echo ERRO: Railway CLI nao esta instalado!
    echo Instale com: npm install -g @railway/cli
    pause
    exit /b 1
)
echo OK: Railway CLI instalado
echo.

echo [2/5] Verificando login...
railway whoami
if %errorlevel% neq 0 (
    echo AVISO: Nao esta logado!
    echo Execute: railway login
    echo.
    pause
    exit /b 1
)
echo OK: Logado no Railway
echo.

echo [3/5] Listando projetos...
railway list
echo.

echo [4/5] Verificando status do projeto atual...
railway status
echo.

echo [5/5] Verificando variaveis de ambiente...
railway variables
echo.

echo ========================================
echo   VERIFICACAO CONCLUIDA!
echo ========================================
echo.
echo Para ver logs: railway logs
echo Para ver deploys: railway list-deployments
echo.
pause

