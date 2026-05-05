# Выгрузка на GitHub

## Что уже сделано локально

- В папке проекта инициализирован **Git**, есть ветка `main` и коммиты.
- Портативный Git лежит в `.tools/mingit` (в репозиторий не попадает).

## Загрузить код на GitHub (один раз)

1. Создайте **Personal Access Token (classic)** с правом `repo`:  
   [https://github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token.

2. В PowerShell в папке проекта:

```powershell
cd "путь\к\проекту"

$env:GITHUB_TOKEN = "ghp_ВАШ_ТОКЕН"
$env:GITHUB_OWNER = "ваш-логин-github"
$env:GITHUB_REPO   = "servicedrive"

powershell -ExecutionPolicy Bypass -File .\scripts\push-to-github.ps1
```

Скрипт при необходимости **создаст** публичный репозиторий `GITHUB_REPO` и выполнит `git push`.

После успешного push можно убрать токен из URL remote (токен окажется в `.git/config`):

```powershell
.\scripts\ensure-git.ps1
$g = ".\.tools\mingit\cmd\git.exe"
& $g remote set-url origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПО.git
```

## Если репозиторий уже создан вручную на сайте

Достаточно тех же переменных и `push-to-github.ps1` (или добавьте remote и `git push` сами).

## Без токена

Создайте пустой репозиторий на GitHub, затем:

```powershell
.\scripts\ensure-git.ps1
$g = ".\.tools\mingit\cmd\git.exe"
& $g remote add origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПО.git
& $g push -u origin main
```

На запрос пароля вставьте **токен** (не пароль от GitHub).
