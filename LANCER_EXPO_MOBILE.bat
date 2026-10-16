@echo off
title Mbeund-Mi Mobile - Expo Go
cd /d "%~dp0mbeund-mi-mobile"
echo ===================================================
echo Lancement d'Expo Go pour Mbeund-Mi Mobile...
echo IP locale : 192.168.1.86:8081
echo ===================================================
npx expo start --go
pause
