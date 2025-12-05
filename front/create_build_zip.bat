@echo off
@chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========== 設定項目 ==========
:: 対象ディレクトリ名
set "TARGET_DIR_NAME=app"
:: 出力ファイル名
set "OUTPUT_ZIP_NAME=internal-front-app.zip"
:: 除外対象
:: EXCLUDE_COUNTの更新も忘れずに！
set "EXCLUDE_COUNT=8"
set "EXCLUDE[0]=%~nx0"
set "EXCLUDE[1]=node_modules"
set "EXCLUDE[2]=.git"
set "EXCLUDE[3]=.vscode"
set "EXCLUDE[4]=.idea"
set "EXCLUDE[5]=dist"
set "EXCLUDE[6]=build"
set "EXCLUDE[7]=coverage"
set "EXCLUDE[8]=app.zip"
:: =============================

:: スクリプトの配置ディレクトリを取得
set "SCRIPT_DIR=%~dp0"
:: 対象ディレクトリを設定
set "TARGET_DIR=%SCRIPT_DIR%%TARGET_DIR_NAME%"
cd /d "%TARGET_DIR%"

:: 一時ディレクトリ名を生成（スクリプト配置ディレクトリに作成）
set "TEMP_DIR=%SCRIPT_DIR%temp_zip_%RANDOM%"

echo ZIP圧縮を開始します...
echo スクリプト配置ディレクトリ: %SCRIPT_DIR%
echo 対象ディレクトリ: %TARGET_DIR%
echo 出力ファイル名: %OUTPUT_ZIP_NAME%

:: 除外リストを表示
echo 除外対象:
for /L %%i in (0,1,%EXCLUDE_COUNT%) do (
    if defined EXCLUDE[%%i] (
        echo   [%%i] !EXCLUDE[%%i]!
    )
)

:: 既存のZIPファイルがあれば削除
if exist "%SCRIPT_DIR%%OUTPUT_ZIP_NAME%" del "%SCRIPT_DIR%%OUTPUT_ZIP_NAME%"

:: 対象ディレクトリの存在確認
if not exist "%TARGET_DIR%" (
    echo エラー: %TARGET_DIR_NAME%ディレクトリが存在しません: %TARGET_DIR%
    pause
    goto :EOF
)

:: 一時ディレクトリを作成
mkdir "%TEMP_DIR%"
echo 一時ディレクトリを作成: %TEMP_DIR%

:: ファイルとディレクトリをコピー（除外対象以外）
echo.
echo ファイルとディレクトリをコピー中...

:: 現在ディレクトリの各アイテムを処理
for /f "delims=" %%i in ('dir /b') do (
    set "item=%%i"
    set "exclude=false"
    
    :: 配列の各要素をチェック
    for /L %%j in (0,1,%EXCLUDE_COUNT%) do (
        if defined EXCLUDE[%%j] (
            if /i "!item!"=="!EXCLUDE[%%j]!" set "exclude=true"
        )
    )
    
    if "!exclude!"=="false" (
        echo コピー: !item!
        if exist "!item!\*" (
            :: ディレクトリの場合
            xcopy "!item!" "%TEMP_DIR%\!item!\" /E /I /H /Y /C >nul 2>&1
        ) else (
            :: ファイルの場合
            copy "!item!" "%TEMP_DIR%\" >nul 2>&1
        )
        if errorlevel 1 (
            echo   警告: !item! のコピーでエラーが発生しました（スキップして続行）
        )
    ) else (
        echo 除外: !item!
    )
)

:: コピー結果を確認
echo.
echo コピー完了 - 一時ディレクトリ内容:
dir "%TEMP_DIR%" /b

:: PowerShellでZIP圧縮
echo.
echo ZIP圧縮中...
:: PowerShellでZIP圧縮（パス正規化版）
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::Open('%SCRIPT_DIR%%OUTPUT_ZIP_NAME%', 'Create'); Get-ChildItem '%TEMP_DIR%' -Recurse | ForEach-Object { $relativePath = $_.FullName.Substring('%TEMP_DIR%'.Length + 1).Replace('\', '/'); if ($_.PSIsContainer) { $entryName = $relativePath + '/'; $entry = $zip.CreateEntry($entryName); } else { [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath); } }; $zip.Dispose()"

:: 一時ディレクトリを削除
echo 一時ディレクトリを削除中...
rmdir /s /q "%TEMP_DIR%"

:: 結果確認
if exist "%SCRIPT_DIR%%OUTPUT_ZIP_NAME%" (
    echo.
    echo ========================================
    echo ZIP圧縮が正常に完了しました
    echo 出力ファイル: %SCRIPT_DIR%%OUTPUT_ZIP_NAME%
    for %%I in ("%SCRIPT_DIR%%OUTPUT_ZIP_NAME%") do (
        set "size=%%~zI"
        set /a "size_kb=!size!/1024"
        echo ファイルサイズ: !size! bytes ^(!size_kb! KB^)
    )
    echo ========================================
) else (
    echo.
    echo ========================================
    echo エラーが発生しました
    echo ========================================
)

pause
goto :EOF