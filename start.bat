@echo off
cd /d "C:\Users\sufiy\OneDrive\Desktop\Bsdsteel\frontend"
echo Starting BSD Steel Frontend...
start "" npm run dev
rem wait a few seconds for the dev server to start
timeout /t 5 > nul
start "" http://localhost:3000
