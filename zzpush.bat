@echo off
:: 关闭错误回显，防止乱码导致崩溃
chcp 936 >nul

echo Starting Force Sync...

:: 1. 强制进入当前脚本所在目录
cd /d "%~dp0"

:: 2. 如果没有 .git 文件夹，就地初始化
if not exist .git (
    echo [Info] Initializing new Git repository...
    git init
)

:: 3. 强制重置远程地址
git remote remove origin >nul 2>&1
git remote add origin https://github.com/wingdna/aiagent.git

:: 4. 强制重命名分支为 main
git branch -M main

:: 5. 执行添加和提交
echo [Info] Adding files...
git add .
git commit -m "Force fix sync" >nul 2>&1

:: 6. 执行强制推送
echo [Info] Pushing to GitHub...
echo -------------------------------------------
git push -u origin main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo SUCCESS! Your code is now on GitHub.
) else (
    echo.
    echo FAILED! Please check your internet or GitHub repository name.
)

pause