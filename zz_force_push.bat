@echo off
chcp 65001 >nul

:: ================= 配置区 =================
:: 已经为你修正为 aiagent
SET REPO_NAME=aiagent
SET GITHUB_USER=wingdna
SET TARGET_BRANCH=main
:: ==========================================

SET REPO_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo ===========================================
echo    aiagent 项目自动同步工具
echo ===========================================

:: 1. 强制纠正远程地址
if exist .git (
    git remote remove origin >nul 2>&1
    git remote add origin %REPO_URL%
    echo [状态] 已更新远程地址为: %REPO_URL%
) else (
    echo [提示] 正在初始化本地仓库并关联 %REPO_NAME%...
    git init
    git remote add origin %REPO_URL%
)

:: 2. 检查并强制切换分支到 main
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%i
if /i not "%CURRENT_BRANCH%"=="%TARGET_BRANCH%" (
    echo [调整] 分支重命名: [%CURRENT_BRANCH%] -> [%TARGET_BRANCH%]
    git branch -M %TARGET_BRANCH%
)

:: 3. 提交与强制推送
echo [状态] 正在整理本地文件...
git add .
git commit -m "aiagent 强制同步: %date% %time%" >nul 2>&1

echo [执行] 正在强制推送至远程 %TARGET_BRANCH% ...
echo -------------------------------------------

:: 运行推送
git push -u origin %TARGET_BRANCH% --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo [成功] aiagent 代码已成功强制覆盖到 GitHub！
) else (
    echo.
    echo [失败] 依然无法推送。
    echo 请确认 GitHub 上是否存在名为 [%REPO_NAME%] 的仓库。
    echo 如果是私有仓库，请确保你已在 Windows 中登录 GitHub 账号。
)

echo.
pause