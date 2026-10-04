# Findbus on Google Play: exact steps

App ID `com.calecutech.findmybus`. Links checked 4 Oct 2026.

## 1. Merge the code
1. Open <https://github.com/vsvivek1/findbus/pull/1>
2. Scroll down → **Merge pull request** → **Confirm merge**

## 2. Make the upload key (once, on your PC)
Needs Android Studio (<https://developer.android.com/studio>) or Java.
Windows: open **PowerShell** and run:
```
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v -keystore findbus-upload-key.jks -storetype PKCS12 -alias findbus-upload -keyalg RSA -keysize 2048 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes("findbus-upload-key.jks")) | Set-Content key.txt
```
Mac/Linux:
```
keytool -genkeypair -v -keystore findbus-upload-key.jks -storetype PKCS12 -alias findbus-upload -keyalg RSA -keysize 2048 -validity 10000
base64 < findbus-upload-key.jks | tr -d '\n' > key.txt
```
Type one password when asked. Back up `findbus-upload-key.jks` + password.

## 3. Add 4 GitHub secrets
Open <https://github.com/vsvivek1/findbus/settings/secrets/actions/new>, add each → **Add secret**:

| Name | Secret |
| --- | --- |
| `FINDBUS_KEYSTORE_BASE64` | contents of `key.txt` |
| `FINDBUS_KEYSTORE_PASSWORD` | your password |
| `FINDBUS_KEY_ALIAS` | `findbus-upload` |
| `FINDBUS_KEY_PASSWORD` | your password |

## 4. Build the .aab
1. Open <https://github.com/vsvivek1/findbus/actions/workflows/android.yml>
2. **Run workflow** → **Run workflow**
3. Wait for green ✓ → click the run → **Artifacts** → download `findbus-play-store-bundle` → unzip → `app-release.aab`

## 5. Create the app
<https://play.google.com/console> → **Create app** → Name `Findbus` → App → Free → tick declarations → **Create app**

## 6. Dashboard setup answers
- Privacy policy: `https://calecutech.com/findmybus/privacy`
- App access: **All functionality available without special access**
- Ads: **No**
- Content rating: fill questionnaire; "shares location" → **Yes**
- Target audience: **18+**
- Data safety: collects **Precise location**, **Name**, **Email**, **Phone** → purpose **App functionality** → not shared → encrypted in transit **Yes** → deletion request **Yes**
- Account deletion URL: `https://calecutech.com/findmybus/delete-account`
- Foreground service → **Location** → text: `Drivers tap Start to share their bus's live location with riders. Runs with screen off while a notification shows; stops on Stop.` → video: record Start → lock phone → notification → Stop, upload to YouTube **Unlisted**, paste link.

## 7. Store listing
**Grow users → Store presence → Main store listing**
- Icon: `app-icon-512.png`
- Feature graphic: `feature-graphic-1024x500.png`
- 2+ phone screenshots (take on phone)
- Short: `See your bus live on the map. Owners share bus location free from any phone.`
- Full: `Findbus shows private and city buses live on a map. Riders search their stop or route and see where each bus is now. Bus owners register free, add buses and routes, and send each driver a link; the driver taps Start in the app and location sharing keeps working with the screen off until they tap Stop. No GPS device, no rider sign-up.`

## 8. Publish
**Test and release → Production → Create new release** → accept Play App Signing → upload `app-release.aab` → **Next** → **Save** → **Send for review**

## Later updates
Only for changes in `android/`: raise `versionCode` in `android/app/build.gradle`, merge, redo step 4 and 8.

## Optional
After first upload: **Test and release → Setup → App signing** → copy **SHA-256** → send to Claude (makes driver links open the app with no prompt).
