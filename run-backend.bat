@echo off
title Tickets - Backend Service (Spring Boot)
cd /d "%~dp0booking-service_1\booking-service"
echo ========================================================
echo   Starting Tickets Backend on http://localhost:8080
echo ========================================================
mvn spring-boot:run
pause
