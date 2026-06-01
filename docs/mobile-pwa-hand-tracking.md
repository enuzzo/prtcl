# Mobile PWA + Hand Tracking

## Mobile Editor

The `/create` route is optimized for phone use as a focused performance surface:

- The top bar exposes effect switching, hand tracking, fullscreen, share, and install controls.
- The effect dropdown is rendered through a portal so it is fixed to the viewport even when the top bar is inside animated/transformed layout wrappers.
- Parameter panels remain desktop-only on mobile to avoid crowding the canvas.

## PWA Install

PRTCL declares `/create` as the app start URL in `public/site.webmanifest`. In production, `src/main.tsx` registers `public/sw.js`, which caches the app shell and lets supported browsers offer an install prompt.

Safari on iOS does not expose `beforeinstallprompt`; users still install from the browser share menu with "Add to Home Screen". The page includes `apple-mobile-web-app-*` metadata and a dedicated 180x180 PNG touch icon at `/apple-touch-icon.png`, which Safari uses for the home screen icon. Chromium-based mobile browsers can show the in-app install button when the install prompt is available and read PNG icons from the versioned web manifest URL.

Run `npm run generate:pwa-icons` after changing `public/favicon.svg` so the Apple touch icon and manifest PNG icons stay visually aligned.

## Hand Gestures

MediaPipe Hands feeds smoothed landmarks into the gesture classifier:

- `open_palm`: keeps existing camera orbit and zoom behavior.
- `fist`: collapses the current effect shape in place by scaling the scene group toward the center.
- `none`: no stable hand gesture; camera returns toward its home position when tracking is not actively engaged.

When a fist is detected after an open palm, camera movement freezes and re-anchors before the hand opens again. This prevents a jump while still making close/open hand gestures visually useful.

## Chrome iOS Camera Notes

Safari on iOS and Chrome on iOS can expose different permission UX even though both run on WebKit. If Chrome does not show a camera prompt, first check iOS Settings > Chrome > Camera. Google documents that when camera access is turned off for Chrome at the device/app level, Chrome may not show a permission prompt for a site.

The hand tracking button surfaces these failures as toasts on mobile instead of only changing the button title. On Chrome iOS, permission denials point users to iOS Settings > Chrome > Camera and ask them to reload PRTCL before trying again.

For Chrome's address bar warning icon on iPhone, use Chrome's overflow menu > Site Information > Connection. Tapping the icon itself may only move or collapse the address bar on iOS.
