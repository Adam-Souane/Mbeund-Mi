#!/bin/bash
# Lance pytest en local, isolé de tout service externe.
cd "C:/Users/pc/Documents/PERSO/Mbeund-Mi/backend"
export PATH="/c/Users/pc/AppData/Local/Programs/OSGeo4W/bin:$PATH"
export PYTHONPATH="C:\Users\pc\AppData\Local\Temp\claude\C--Users-pc-Documents-PERSO-Mbeund-Mi\942b1416-43b3-40b0-819c-3ed10571703f\scratchpad\testcfg"
export USE_GIS=False REDIS_URL=redis://127.0.0.1:6399/0 TWILIO_ACCOUNT_SID= TWILIO_AUTH_TOKEN= GROQ_API_KEY= OPENWEATHER_API_KEY= OPENWEATHERMAP_API_KEY= FIREBASE_CREDENTIALS_PATH=/nonexistent/firebase.json FIREBASE_CREDENTIALS_JSON= WHATSAPP_ACCESS_TOKEN= WHATSAPP_PHONE_NUMBER_ID= GEE_PROJECT_ID=
../env/Scripts/python.exe -m pytest -q -p no:cacheprovider --ds=settings_audit "$@"
