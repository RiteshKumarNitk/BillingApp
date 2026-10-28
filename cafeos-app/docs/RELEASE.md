# CafeOS app — release builds

## 1. One-time: create the upload key

The Play Store identifies your app by the key that signs it. **If this key is lost, you can never
publish an update to the same app listing.** Create it once, then back it up in two places outside
this computer (e.g. a password manager + an encrypted drive).

```powershell
# JDK 17 is at C:\dev-tools\jdk17 on the build machine (any JDK 17+ works)
& "C:\dev-tools\jdk17\bin\keytool.exe" -genkeypair -v `
  -keystore "$env:USERPROFILE\cafeos-upload.jks" `
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Then create `cafeos-app/android/key.properties` (git-ignored — never commit it):

```properties
storePassword=<the keystore password you chose>
keyPassword=<the key password you chose>
keyAlias=upload
storeFile=C:/Users/<you>/cafeos-upload.jks
```

Without `key.properties`, release builds are signed with the **debug** key and Gradle prints a
warning. Those APKs are fine for testing on phones but can't be uploaded to the Play Store.

## 2. Every release

1. Bump `version:` in `pubspec.yaml` — `1.0.1+2` means version name 1.0.1, version code 2. The
   version code must increase for every upload.
2. Build (from `cafeos-app/`, with the toolchain on PATH):

   ```bash
   flutter build appbundle --release   # Play Store upload: build/app/outputs/bundle/release/app-release.aab
   flutter build apk --release         # direct install / testing: build/app/outputs/flutter-apk/app-release.apk
   ```

3. The app talks to the production backend by default
   (`https://billing-app-jade-beta.vercel.app/api/mobile`, see `lib/core/utils/app_constants.dart`).
   To build against another backend:
   `flutter build apk --release --dart-define=API_BASE_URL=https://<host>/api/mobile`

## 3. Before the first Play Store release (not done yet)

- **App icon:** the app still uses Flutter's default icon. Add a 1024×1024 PNG and generate the
  launcher icons (e.g. the `flutter_launcher_icons` package).
- **Store listing:** screenshots, privacy policy URL (the app collects location and camera use for
  QR scanning), content rating.
- **Application ID** `com.cafeos.cafeos_app` is permanent once published — change it now if you
  want a different one.
