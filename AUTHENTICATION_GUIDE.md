# Google authentication setup

Status: web and Android flows implemented in code, awaiting Google OAuth
credentials, production deployment, and an Android 1.3.0 build.

## Architecture

- Production-only Amazon Cognito User Pool.
- Google federation through Cognito managed login.
- Separate public web and Android app clients using OAuth authorization-code
  flow with PKCE.
- Access and ID tokens expire after one hour; refresh tokens after 30 days.
- Browser tokens live only in `sessionStorage`, never `localStorage`.
- Android opens Cognito in the system browser and returns through
  `moraltorturemachine://auth/callback`.
- Android encrypts session and PKCE material with an AES-GCM key held by Android
  Keystore; only ciphertext is stored in app-private SharedPreferences.
- The backend validates JWT signature, issuer, audience, expiry, and `token_use`.
- The backend accepts only the registered web and Android Cognito audiences.
- Administrators belong to the Cognito group `admins`.

The Android login requires APK version 1.3.0 (`versionCode` 7) or newer. Older
APKs remain compatible with the optional-auth backend and continue to work
anonymously, but they cannot receive the native OAuth callback.

## 1. Create the Google OAuth client

In Google Cloud Console, configure the OAuth consent screen and create an OAuth
2.0 Client ID with application type **Web application**.

Authorized domains:

- `amazoncognito.com`
- `moraltorturemachine.com`

Authorized JavaScript origin:

```text
https://moral-torture-machine-586250839220.auth.eu-west-1.amazoncognito.com
```

Authorized redirect URI:

```text
https://moral-torture-machine-586250839220.auth.eu-west-1.amazoncognito.com/oauth2/idpresponse
```

Request only `openid`, email, and profile scopes. While the consent screen is in
testing mode, add the Google accounts that must be able to sign in as test users.

## 2. Store credentials without exposing them

Never paste the Google client secret into chat, source files, `.env` files, or
shell history. Store both values as GitHub Actions secrets; `gh` reads each value
from standard input without echoing it back:

```bash
gh secret set GOOGLE_OAUTH_CLIENT_ID
gh secret set GOOGLE_OAUTH_CLIENT_SECRET
```

For a one-off local Terraform plan/apply, set the sensitive variables only in the
current terminal session:

```bash
export TF_VAR_google_oauth_client_id='...'
export TF_VAR_google_oauth_client_secret='...'
```

The Terraform state is encrypted in the private production state bucket. Cognito
provider details are nevertheless sensitive state and must never be exported or
shared.

## 3. Deploy and test

The production workflow obtains Cognito outputs from Terraform and injects only
the public Cognito domain and app-client IDs into the frontend build. It never
injects the Google client secret into the frontend.

After deployment:

1. Open `https://moraltorturemachine.com`.
2. Choose **Accedi con Google**.
3. Complete Google consent and return through `/auth/callback`.
4. Confirm that logout works and a reload preserves only the current-tab session.

## 4. Build and test Android authentication

Terraform exposes `cognito_android_client_id`. Build the Android bundle with the
public domain and native client ID available to Vite:

```bash
cd backend/terraform
export VITE_COGNITO_DOMAIN="$(terraform output -raw cognito_domain)"
export VITE_COGNITO_NATIVE_CLIENT_ID="$(terraform output -raw cognito_android_client_id)"
cd ../../frontend
pnpm build:prod
pnpm exec cap sync android
cd android
./gradlew testDebugUnitTest assembleDebug
```

The app manifest accepts only the `moraltorturemachine://auth/*` host and the
authentication client accepts only `/callback` and `/logout`. Validate on a real
device or emulator:

1. Anonymous gameplay still works before login.
2. **Accedi con Google** opens the system browser.
3. Google/Cognito returns to the same screen in the app.
4. Closing and reopening the app restores the encrypted session.
5. Logout clears the local session and returns from the Cognito browser flow.
6. An older APK continues to play anonymously against the same backend.

Google still needs one OAuth client of type **Web application**, because Google
redirects to Cognito's `/oauth2/idpresponse`; the separate Android client is a
Cognito public app client and has no embedded secret.

## 5. Grant administrator access

After the first successful Google login, list the new Cognito user and add the
correct username to the `admins` group:

```bash
POOL_ID=$(aws cognito-idp list-user-pools \
  --max-results 60 \
  --region eu-west-1 \
  --profile personal \
  --query "UserPools[?Name=='prod-moral-torture-machine-users'].Id | [0]" \
  --output text)

aws cognito-idp list-users \
  --user-pool-id "$POOL_ID" \
  --region eu-west-1 \
  --profile personal

aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$POOL_ID" \
  --username 'THE_EXACT_COGNITO_USERNAME' \
  --group-name admins \
  --region eu-west-1 \
  --profile personal
```

The user must sign out and sign in again after the group assignment so Cognito
issues a new ID token containing `cognito:groups: ["admins"]`.

The analytics SSM key remains available only as break-glass access during the
authentication migration.
