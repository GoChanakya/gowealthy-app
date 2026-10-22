# Deploy backend-main from PowerShell

```powershell
# 1. Unzip and go into the folder
Expand-Archive .\backend_main.zip -DestinationPath C:\Users\Dell\Documents\gochanakya
cd C:\Users\Dell\Documents\gochanakya\backend_main

# 2. (Optional) run the tests
python -m pip install -r requirements.txt pytest jsonschema
python -m pytest -q                      # expect: 18 passed

# 3. Deploy (in a new PowerShell window run the Set-ExecutionPolicy line first): service account, Cloud Run service (4 GB) and daily 01:00 IST schedule. About 3-5 minutes.
gcloud config set project gochanakya-main
Set-ExecutionPolicy -Scope Process Bypass
.\deploy.ps1

# 4. Run it once now and see the result straight away (takes about 1-2 minutes)
$TOKEN = gcloud auth print-identity-token
$URL = gcloud run services describe backend-main --region asia-south1 --format="value(status.url)"
Invoke-RestMethod -Uri "$URL/run" -Method Post -Headers @{ Authorization = "Bearer $TOKEN" } -TimeoutSec 900

# 5. Check the files and compare with the existing services
gcloud storage ls gs://mf-data-public/backend_main_kartik/
python verify_against_sources.py
```

Step 4 should print something like: `fund_cards 2128, with_batting 1966, with_momentum 1944, with_sip_3y 1392 ...`

Step 5 should show:
- batting: untouched months 100% identical to monthly_returns;
- momentum ranks mostly identical;
- SIP identical except about 33 face-value ETFs;
- stress-event recovery months 100% identical.

## Retire returns-calc (once step 4 has worked)
backend-main now writes the same returns files. Remove the old service so the two don't both run at 01:00:

```powershell
gcloud scheduler jobs delete returns-calc-daily --location asia-south1 --quiet
gcloud run services delete returns-calc --region asia-south1 --quiet
gcloud iam service-accounts delete returns-calc-runner@gochanakya-main.iam.gserviceaccount.com --quiet
gcloud projects remove-iam-policy-binding gochanakya-main --member="serviceAccount:returns-calc-runner@gochanakya-main.iam.gserviceaccount.com" --role=roles/storage.admin --quiet
```

After this, the service runs every day at 01:00 IST on its own. To ship a code change, run `.\deploy.ps1` again.
