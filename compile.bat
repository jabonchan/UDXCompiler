@Echo Off

CD %~dp0
deno compile -A mod.ts

Exit /b