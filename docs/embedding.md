# Proposed makers.umn.edu integration

The prototype is independent at `/tour/makerspaces/`. The same responsive page
supports `?embed=1`; no script must be installed in the University's page.
Its directory and controls live in the native **Makerspaces** tab, available
through **+ → Makerspaces**. It has no separate top bar or floating directory.

```html
<iframe
  src="https://umn-vr.github.io/tour/makerspaces/?embed=1"
  title="University of Minnesota makerspaces virtual tour"
  width="100%"
  height="680"
  style="border:0;min-height:480px;display:block"
  loading="lazy"
  allow="fullscreen; xr-spatial-tracking"
  allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>
```

The host can choose a responsive height (for example `min(78vh, 800px)`) after
testing its own navigation and mobile layout. The iframe has a title, retains
image credits, and opens official source links in a new tab. It does not read
the parent DOM, navigate the top page, send messages to the parent, require a
login, or depend on third-party cookies. Keyboard and touch must be checked in
UMN's actual page before launch. Immersive XR also depends on the host's
Permissions Policy and device support; ordinary 360 viewing remains available.

`embed-preview.html` provides a local/same-origin harness. Passing it does not
prove UMN's CSP permits the frame. UMN would need to allow
`https://umn-vr.github.io` in its `frame-src` policy. No code or content changes
have been made to makers.umn.edu, and no one has been contacted.

## Runtime isolation

All new files live below `/tour/makerspaces/`. The prototype does not register
a service worker or require cross-origin isolation/shared memory. It uses
FOSS Earth's public app and Vite exports; no copy of the globe, panorama viewer
or shared UI is maintained here. An existing `/tour/` service worker may already
control a returning visitor, so test a fresh profile and a returning visitor.

## Before wider release

1. Identify and import the owner's Anderson Labs originals, preserving source,
   photographer, date, projection and measured/approximate capture provenance.
2. Verify room labels, current access instructions and image reuse with space
   owners. Add real panoramas for additional spaces as they become available.
3. Review the prototype on desktop, phone, keyboard, and the actual embedded
   UMN page. Include fallback links if the frame cannot load.
4. Only after approval, add a Makerspaces entry to `/tour/`. That is a separate
   change; this prototype does not edit or link from the campus selector.

Unlisted means absent from navigation and marked `noindex`; it is not an
authentication or privacy boundary.
