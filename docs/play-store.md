# Publishing Findbus on Google Play

The Android app (`android/`) is a Capacitor shell around the live site
(`https://findbus-azure.vercel.app`). It adds background GPS so a driver's
phone keeps sending the bus location with the screen off. Web changes reach
the app without a Play update; only changes under `android/` or
`capacitor.config.ts` need a new upload.

App ID: `app.findbus.android`. Every link below was checked on 4 Oct 2026.

## 1. Merge PR #1

The app loads the live site, so the driver tracking code, the privacy page
and the build workflow must be on `main` first.
<https://github.com/vsvivek1/findbus/pull/1>

## 2. Create your upload key (once, on your computer)

You need `keytool`, which comes with Java or with Android Studio
(<https://developer.android.com/studio>). On Windows it is at
`C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`.

```
keytool -genkeypair -v -keystore findbus-upload-key.jks -storetype PKCS12 -alias findbus-upload -keyalg RSA -keysize 2048 -validity 10000
```

It asks for a password (use the same one when asked for the key password)
and your name. **Back up the `.jks` file and password somewhere safe.** If it
is lost, the upload key can be reset through Play support, but it is slow.

Turn the file into text for GitHub:

- Mac: `base64 -i findbus-upload-key.jks | tr -d '\n' > key.txt`
- Linux: `base64 -w0 findbus-upload-key.jks > key.txt`
- Windows PowerShell:
  `[Convert]::ToBase64String([IO.File]::ReadAllBytes("findbus-upload-key.jks")) | Set-Content key.txt`

## 3. Add four GitHub secrets

Open <https://github.com/vsvivek1/findbus/settings/secrets/actions/new> and
add each one (help: <https://docs.github.com/actions/security-guides/using-secrets-in-github-actions>):

| Name | Value |
| --- | --- |
| `FINDBUS_KEYSTORE_BASE64` | the whole contents of `key.txt` |
| `FINDBUS_KEYSTORE_PASSWORD` | your keystore password |
| `FINDBUS_KEY_ALIAS` | `findbus-upload` |
| `FINDBUS_KEY_PASSWORD` | the same password |

## 4. Build the app

1. Open <https://github.com/vsvivek1/findbus/actions/workflows/android.yml>.
2. Click **Run workflow** → **Run workflow** (branch `main`).
3. When it turns green, open the run and download, under *Artifacts*:
   - `findbus-test-apk`: unzip and install `app-debug.apk` on an Android
     phone to try it (allow "install unknown apps" when asked).
   - `findbus-play-store-bundle`: unzip to get `app-release.aab`, the file
     you upload to Play.

## 5. Create the app in Play Console

<https://play.google.com/console> → **Create app**
(help: <https://support.google.com/googleplay/android-developer/answer/9859152?hl=en>).
Name **Findbus**, type **App**, **Free**, accept the declarations.

## 6. Finish "Set up your app" on the dashboard

Help: <https://support.google.com/googleplay/android-developer/answer/9859454?hl=en-EN>

- **Privacy policy:** `https://findbus-azure.vercel.app/privacy`
- **App access:** All functionality is available without special access
  (owners register for free at `/owner`; no login).
- **Ads:** No ads.
- **Content rating:** answer the questionnaire (no violence, no user chat,
  shares location: **Yes**).
- **Target audience:** 18 and over.
- **Data safety**
  (help: <https://support.google.com/googleplay/android-developer/answer/10787469?hl=en>):
  - Collected: **Location → Precise location** (drivers only, app
    functionality); **Personal info → Name, Email address, Phone number**
    (owners and waitlist, app functionality, account management).
  - Data is encrypted in transit: **Yes**. Users can request deletion: **Yes**.
  - Not used for ads, not sold.
- **Account deletion URL** (owners create an account,
  help: <https://support.google.com/googleplay/android-developer/answer/13327111?hl=en>):
  `https://findbus-azure.vercel.app/privacy` (section "Keeping and deleting data").
- **Foreground service permissions** (the driver tracking notification,
  help: <https://support.google.com/googleplay/android-developer/answer/13392821?hl=en>):
  choose **Location**, and describe it as: *"Drivers tap Start to share their
  bus's live location with riders during a trip. Tracking continues with the
  screen off while a notification is shown, and stops when the driver taps
  Stop."* Play asks for a short video: record your phone opening a driver
  link, tapping Start, locking the screen (notification visible) and tapping
  Stop, then upload it to YouTube as **Unlisted** and paste the link.
- The app does **not** request "background location"
  (`ACCESS_BACKGROUND_LOCATION`), so that separate declaration is not needed.

## 7. Store listing

**Grow → Store presence → Main store listing**

- App icon: `app-icon-512.png` (also `public/icon-512.png` in the repo)
- Feature graphic: `feature-graphic-1024x500.png`
- Phone screenshots: at least 2. Take them on your phone from the test APK
  (the bus map, the owner dashboard, the driver Start screen).
- Short description (80 characters max):
  `See your bus live on the map. Owners share bus location free from any phone.`
- Full description:

  > Findbus shows private and city buses live on a map, so you stop guessing
  > at the bus stop.
  >
  > For riders: search by your stop or route and see where each bus is right
  > now, with how long ago it was last seen.
  >
  > For bus owners: register free, add your buses, routes and stops, and send
  > each driver a link. The driver opens it in the Findbus app and taps
  > Start. Location sharing keeps working with the screen off and stops when
  > the driver taps Stop.
  >
  > No GPS device to buy and nothing for riders to sign up for.

## 8. Test, then go live

Play App Signing: on your first upload, accept the Google-generated app
signing key (help: <https://support.google.com/googleplay/android-developer/answer/9842756?hl=en>).

1. **Internal testing** (fast, up to 100 people): **Test and release →
   Testing → Internal testing → Create new release**, upload `app-release.aab`,
   add your own email as a tester, install from the opt-in link.
   Help: <https://support.google.com/googleplay/android-developer/answer/9845334?hl=en>
2. **Closed testing for 14 days.** Personal developer accounts created after
   13 Nov 2023 must run a closed test with at least 12 testers opted in for
   14 days in a row before they can apply for production.
   Help: <https://support.google.com/googleplay/android-developer/answer/14151465?hl=en>
   Bus owners and drivers you are onboarding are ideal testers. (Organisation
   accounts skip this.)
3. **Production:** after the closed test, click **Apply for production** on
   the dashboard, then create a production release with the same `.aab`.
   Help: <https://support.google.com/googleplay/android-developer/answer/9859348?hl=en>

## Updating the app later

Only needed when something under `android/` or `capacitor.config.ts`
changes. Increase `versionCode` (and `versionName`) in
`android/app/build.gradle`, merge, run the workflow, upload the new `.aab`.

## Optional: open driver links straight in the app

Today a tapped driver link may ask "Open with Findbus or browser?". After the
first Play upload, copy the **SHA-256** from **Test and release → Setup →
App signing** and send it to Claude to add `/.well-known/assetlinks.json`,
which lets Android open those links in the app with no prompt.
