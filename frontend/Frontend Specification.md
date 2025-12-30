Markdown spec for the missing frontend features you asked for:
user registration & login, user profile / account center, subscriptions page (view active subscriptions), device management (add/change/remove devices / MACs), free-trial rules (registered users only), and how everything should behave and integrate with your backend.

This is ready-to-implement detail for your frontend dev (Next.js or React). It contains routes, components, API contracts, UI behaviour, validation rules, acceptance criteria and implementation notes.

Table of contents

Overview & goals

Pages / routes

Components (per page)

Key data models (JSON)

API contracts (requests & responses)

UX / Interaction flows

Device & MAC handling details

Free-trial rules & enforcement

Authentication & session recommendations (security)

Validations & constraints

Error handling, logging & analytics events

Accessibility & responsiveness guidelines

Acceptance criteria & QA checklist

Implementation notes & recommended libraries

1. Overview & goals

Provide registered user accounts so users can:

register / login (email optional, phone required),

view and manage their subscriptions,

add/remove/change devices (MAC addresses) for subscriptions that allow >1 device,

claim the Free Trial (only for registered users; one free trial per device MAC),

keep easy front-end integration with your Node backend.

Preserve captive-portal experience: when a user reaches the portal from the hotspot the portal passes mac and ip in query params — the app auto-captures those values where applicable (for "use this device" flows).

For now MPESA & OTP are disabled in the UI; voucher flow remains primary.

2. Pages / routes

Use these routes (Next.js Pages Router or React Router equivalents):

/                  -> packages listing (existing page)
 /portal           -> captive portal landing (existing)
/ads               -> post-auth adverts (existing)
 /auth/register     -> Register (new)
 /auth/login        -> Login (new)
 /account           -> protected dashboard / account center (new)
 /account/profile   -> profile edit (name, email, phone, password change)
 /account/subscriptions -> list active & past subscriptions (new)
 /account/subscriptions/[id] -> subscription detail & device management (new)
 /account/devices   -> devices overview (all devices linked to user) (new)
 /account/settings  -> account settings (logout, delete account) (new)


All /account/* routes must be protected (require login). If user not logged in, redirect to /auth/login?next=/account/....

3. Components

Re-usable components to implement:

AuthForm — Register / Login shared form pieces.

ProtectedRoute / withAuth — guard for protected pages.

ProfileForm — name, email (optional), phone (required), change password.

SubscriptionsList — card list of user's subscriptions (status, start/end, package, devices).

SubscriptionDetail — shows package details + device list + buttons to add/remove device(s).

DeviceList — list device rows with MAC, addedAt, status (active/inactive), source (auto-captured/manual).

AddDeviceModal — input MAC (auto-populate if portalData.mac present), button Add device (this device).

EditDeviceModal — change MAC for a saved device.

ConfirmDialog — used for remove/cancel actions.

FreeTrialCTA — only visible to registered users eligible for free trial.

Toast — global toast for successes/errors.

Loader — small loading indicator for API actions.

4. Key data models (frontend / backend-compatible)
User
{
  "_id": "userId123",
  "name": "Eston Mbogo",
  "email": "optional@example.com",
  "phone": "2547XXXXXXXX",
  "createdAt": "2025-09-29T...",
  "lastLogin": "...",
  "devices": ["mac1","mac2"],       // optional cached list of devices user added
  "freeTrialUsedMacs": ["AA:BB:..."] // MACs that already used free trial
}

Subscription
{
  "_id": "subId123",
  "userId": "userId123",
  "packageKey": "kumi-1hr",
  "packageName": "Kumi Net",
  "priceKES": 10,
  "startAt": "2025-09-01T...",
  "endAt": "2025-09-01T...", 
  "durationSeconds": 3600,
  "devicesAllowed": 1,
  "devices": [
    { "id":"d1", "mac":"AA:BB:CC:11:22:33", "addedAt":"...", "active": true, "linkedDeviceName": "Eston-phone" }
  ],
  "status": "active" // or pending, expired, cancelled
}

Device
{
  "id": "d1",
  "userId": "userId123",
  "mac": "AA:BB:CC:11:22:33",
  "label": "Office iPhone",
  "source": "manual" | "portal",  // portal means auto-captured
  "createdAt": "...",
  "freeTrialUsed": false
}

5. API contracts (frontend ↔ backend)

Use HTTPS and either Authorization: Bearer <JWT> header or HttpOnly cookie sessions (recommended cookies). Examples below use Bearer tokens for clarity.

Register

POST /api/auth/register
Body:

{ "name":"Eston", "phone":"2547XXXXXXXX", "email":"optional@x.com", "password":"P@ssw0rd" }


Success (201):

{ "ok": true, "user": {...}, "token": "<JWT>" }

Login

POST /api/auth/login
Body:

{ "phone":"2547XXXXXXXX", "password":"P@ssw0rd" }


Success (200):

{ "ok": true, "user": {...}, "token": "<JWT>" }

Me (get current user)

GET /api/auth/me (Auth required)
Response:

{ "ok": true, "user": {...} }

Free trial (claim)

POST /api/subscriptions/free-trial (Auth required)
Body:

{ "mac": "AA:BB:CC:11:22:33" }   // portal-captured mac strongly recommended


Checks server-side:

user must be registered & logged in

mac hasn't had a free trial before (global)

user hasn't claimed more than allowed (policy)
Success:

{ "ok": true, "subscription": { ... } }

List user's subscriptions

GET /api/subscriptions (Auth required)
Response:

[{ subscription1 }, { subscription2 }, ...]

Get subscription detail

GET /api/subscriptions/:id (Auth required)

Add device to subscription

POST /api/subscriptions/:id/devices (Auth required)
Body:

{ "mac": "AA:BB:CC:11:22:33", "label": "Phone", "autoCapture": true }


Server checks:

user owns subscription

number of devices < devicesAllowed

mac format valid

if free trial eligibility implied, forbid if used.

Response: updated subscription object.

Edit device (change mac)

PUT /api/subscriptions/:id/devices/:deviceId
Body: { "mac":"...", "label":"..." }
Server checks uniqueness & validations.

Remove device

DELETE /api/subscriptions/:id/devices/:deviceId (Auth required)

Redeem voucher (existing)

POST /api/vouchers/redeem
Body: { code, mac?, ip?, packageKey? }
(If user logged in backend should associate subscription with user.)

6. UX / Interaction flows

Below are the important user journeys.

A. Registration → claim free trial

User opens /auth/register.

Fills name, phone (required), email (optional), password, confirm password.

On submit, POST /api/auth/register.

On success store token (HttpOnly cookie recommended; else store in memory or secure storage), redirect to /account/subscriptions or the next query param.

User now eligible to claim Free Trial:

Go to Packages page or Account → Subscriptions → Free Trial CTA visible.

When user clicks Claim Free Trial:

If portalData.mac present use it automatically.

Else ask to connect to Eco Wifi to auto-capture or manually enter MAC (warn that manual MAC may be rejected).

Frontend posts POST /api/subscriptions/free-trial with mac.

On success show subscription & redirect to /ads.

B. Login → manage subscriptions

User logs in.

On /account/subscriptions, they see a list:

Active subs: show package, startAt, endAt, devicesAllowed, devices array.

For each subscription, show Manage Devices button to open subscription detail page.

On SubscriptionDetail:

List devices with Edit and Remove buttons.

Add device button (if devices.length < devicesAllowed).

If user is on hotspot portal and portalData.mac matches client device, show Add this device button (auto-capture).

Otherwise allow manual MAC input (validated).

When adding, frontend calls POST /api/subscriptions/:id/devices; show Adding... state, on success update list and display confirmation.

C. Add / change device rules

Adding device requires device MAC.

When changing a device MAC, the backend must ensure the new MAC is not already used for the same subscription.

When removing a device, backend should optionally revoke access from MikroTik ip-binding for that MAC (backend handles RouterOS API call).

UI must confirm destructive actions.

7. Device & MAC handling details (technical)
MAC auto-capture from portal

Router redirects captive clients to /portal?mac=AA:BB:CC:...&ip=192.168....

Frontend reads query string and stores portalData in sessionStorage (so navigation preserves it).

When the user logs in after landing on portal, call backend to link portalData.mac with the user's account (consent prompt required).

MAC manual entry

Provide an input with the MAC regex validator:

Regex: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/

Accept uppercase or lowercase, normalize to uppercase colon format before sending to backend (AA:BB:CC:11:22:33).

"This device" flow

If portalData.mac present, show a single-click Add this device button that pre-fills MAC and calls the API.

Also show Confirm device UI that displays detected MAC and a small help text: "This is the MAC of the device you're using. Adding this links this device to your subscription."

Device limit checks (client-side + server-side)

Client should check devices.length < devicesAllowed and disable Add button if limit reached.

Server is the source of truth — client checks are optimistic UI; server must enforce limits.

Security: tampering with MAC

MAC can be spoofed — enforce additional checks where possible:

Tie session to IP + MAC for a short window,

Use RouterOS ip-binding and validate access after assignment; if a mismatch occurs mark subscription pending and inform user to reconnect.

8. Free-trial rules & enforcement

Policy (as you specified):

Only registered and logged-in users can claim the free trial.

One free trial per device MAC (device-based enforcement). Even if someone uses another phone number, the same device MAC cannot claim free trial again.

Optionally: one free trial per user account (backend may enforce both: user account cannot claim more than once and MAC cannot be reused).

Frontend behavior:

On Packages and Account pages show a clear Free Trial CTA when:

user is logged in

user.freeTrialUsedMacs does not include portalData.mac (if portalData present)

If user not logged in clicking Free Trial directs to /auth/register?next=/account/subscriptions with note: "You must register to claim the free trial."

If the portal has no mac param, show instructions to connect to Eco Wifi or to manually enter the device MAC (with an explanation that the server may reject manual entries).

Server-side checks (frontend must expect these responses):

400 if mac missing or invalid

403 if user not eligible

409 if MAC already used for free trial

9. Authentication & session recommendations (security)

Prefer: HttpOnly secure cookies for sessions — easier and safer for captive/portal flows (no XSS-exposed tokens). However if you use JWT in headers, implement refresh tokens.

Upon login/register backend should set a secure HttpOnly cookie session (SameSite=lax or none, secure in production).

Frontend uses GET /api/auth/me to check auth status (no token in localStorage).

For protected API calls (e.g. device management) use cookie auth or include Authorization header.

Remember: when clients use captive portal they may not have cross-site cookies set yet — test carefully.

Password policy

Minimum 8 characters, at least one letter and one number (recommend Zxcvbn or simple regex).

Store hashed passwords server-side (bcrypt).

No OTP for now

Password recovery via OTP is disabled. Add a clear warning in registration / profile: "Password recovery by SMS is currently disabled. Keep your password safe."

10. Validations & constraints (frontend)

Phone (Kenya): ^(?:\+254|0)?7\d{8}$ or more strictly ^(?:254|0)7\d{8}$ convert to E.164 on backend: 2547XXXXXXXX.

Email: standard HTML5 type="email" validation.

Password: min 8 chars, at least one letter and one number.

MAC address: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/

Voucher code: ^[A-Z0-9-]{4,20}$ (uppercase conversion on input).

Subscription device limits: check before add.

11. Error handling, logging & analytics

Show inline errors for form fields and toasts for general outcomes.

Track analytics events (console or real analytics):

register_attempt, register_success, register_failure

login_attempt, login_success, login_failure

claim_free_trial_attempt, claim_free_trial_success/failure

add_device, remove_device, edit_device

On errors from backend log server-provided error field and an errorCode if available so admin can triage.

Use frontend console logs sparingly in production and send important client-side errors to your logging endpoint /api/logs.

12. Accessibility & responsiveness

Keyboard navigable forms and focus trapping in modals.

Sufficient contrast for CTAs on brand backgrounds.

Use semantic HTML, labels for inputs.

Mobile-first layout: single-column on phones, grid on larger screens.

Touch targets >= 44x44 px.

13. Acceptance criteria & QA checklist

Auth & Profile

 User can register with name, phone, password; backend returns token and user profile.

 User can login with phone + password.

 GET /api/auth/me returns user object when logged in.

 User profile can be updated (name, email, phone). Password change works.

Subscriptions

 /account/subscriptions lists user's subscriptions.

 Subscription detail shows package info, devices list, start/end times.

 Add device allowed only if devices.length < devicesAllowed.

 Add/change/remove device properly updates server and UI.

Free trial

 Free trial CTA visible only to logged-in eligible users.

 Free trial fails if MAC already used globally.

 Free trial success creates a subscription and redirects to /ads.

Devices & Portal

 Portal mac/ip are auto-captured and pre-filled where applicable.

 Add this device button uses portal-captured MAC.

 Removing a device revokes hotspot access (backend handles RouterOS API call).

Security

 Sensitive tokens not stored in localStorage (prefer cookies).

 Password change requires current password confirmation.

14. Implementation notes & recommended libraries

Framework: Next.js (Pages or App router) — you already used Next in MVP.

State & data fetching:

Lightweight: useState, useEffect + central lib/api.js.

For better caching: SWR or React Query for subscription lists and server state.

Forms & validation:

react-hook-form + zod (recommended) — fast, small bundle.

Or simple controlled components with inline validators.

UI:

Reuse the existing CSS theme. Add new components to the same design system.

Keep animations subtle: transform/opacity transitions.

Auth

Prefer HttpOnly cookies set by backend on login/register (less attacker-exposed).

If using JWT in header, use in-memory storage + refresh token flow.

Device detection & portal params

On landing read mac and ip from window.location.search and store in sessionStorage as eco.portalData.

Testing

Unit tests for validators and device management functions.

Integration tests (Postman / Cypress) for API flows: register -> claim free trial -> subscribe -> add device.

Example UI copy snippets

Register form header: Create your Eco Wifi account — get faster access and track your subscriptions.

Login: Welcome back — sign in to manage your subscriptions.

Free trial CTA: Claim 1-day Free Trial (Registered users only).

Add device help: Your device MAC address is used to identify which device can use this package. If you're on this device, connect via Eco Wifi to auto-detect.