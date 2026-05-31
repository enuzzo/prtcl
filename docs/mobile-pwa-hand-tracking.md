# Mobile PWA + Hand Tracking

## Mobile Editor

The `/create` route is optimized for phone use as a focused performance surface:

- The top bar exposes effect switching, hand tracking, fullscreen, share, and install controls.
- The effect dropdown is rendered through a portal so it is fixed to the viewport even when the top bar is inside animated/transformed layout wrappers.
- Parameter panels remain desktop-only on mobile to avoid crowding the canvas.

## PWA Install

PRTCL declares `/create` as the app start URL in `public/site.webmanifest`. In production, `src/main.tsx` registers `public/sw.js`, which caches the app shell and lets supported browsers offer an install prompt.

Safari on iOS does not expose `beforeinstallprompt`; users still install from the browser share menu with "Add to Home Screen". Chromium-based mobile browsers can show the in-app install button when the install prompt is available.

## Hand Gestures

MediaPipe Hands feeds smoothed landmarks into the gesture classifier:

- `open_palm`: keeps existing camera orbit and zoom behavior.
- `fist`: collapses the current effect shape in place by scaling the scene group toward the center.
- `none`: no stable hand gesture; camera returns toward its home position when tracking is not actively engaged.

When a fist is detected after an open palm, camera movement freezes and re-anchors before the hand opens again. This prevents a jump while still making close/open hand gestures visually useful.
