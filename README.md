# UMN makerspaces tour prototype

Unlisted prototype: **https://umn-vr.github.io/tour/makerspaces/**

This repository owns a new FOSS Earth scene and its independent host page.
The existing `/tour/` campus selector, campus pages, runtime and media are not
rebuilt or changed by this prototype's deployment. No navigation link is added
to the campus selector. Search engines receive `noindex, nofollow, noarchive`;
the URL is public to anyone who has it.

The starting 360° view is the existing **Toaster Innovation Hub** panorama from
the Twin Cities tour. The Anderson Labs previews are ordinary photographs,
clearly labeled separately from the panorama. Other spaces have verified
directory entries and official links, with further photography to collect.
Imagery is a reference to the photographed space, not a current equipment or
access guarantee. Check each space's official site before visiting.

## Development

Use the same side-by-side workspace as [UMN-VR/tour](https://github.com/UMN-VR/tour):
`UMN-VR/makerspaces`, `UMN-VR/twin-cities`, the FOSS Earth repositories under
`foss-earth/`, and `Felipegalind0/gamepad-tools`. Install the FOSS Earth app's
dependencies first if needed. Then:

```sh
npm install
npm run dev
```

Use the address printed by Vite, with `/tour/makerspaces/`. Stop an existing
server before reusing its port. Open **+ → Makerspaces** for the directory and
tour controls, which live in the app's native tab interface. There is no separate
top bar. `?embed=1` uses the same tabbed interface in an iframe;
`embed-preview.html` demonstrates that view.

## Content and images

- `content/spaces.json`: campus, room, short description, official source and
  photograph metadata for every directory entry.
- `content/tour.json`: the source scene and selected genuine panoramas.
- `scripts/build-scene.mjs`: generates `scene.json`, retaining image revisions,
  attribution and placement provenance while resolving media to existing URLs.
- `public/media/`: Anderson Labs reference photographs; sources and rights are
  documented in [research](docs/research.md).

After selecting or changing a panorama, run `npm run build:scene`. The source
defaults to the sibling Twin Cities scene. The generated scene contains no
fabricated capture points and no links to absent panoramas. Its Toaster image
URLs continue using `/tour/twin-cities/media/`; no parent media are replaced.

The shared app includes **+ → Add image**: view a Google panorama with Google's
viewer, or add a prepared original to a validated scene draft and download it.
The nearby Google orb discovery layer is a proposed follow-up, not implemented.

Your Anderson Labs Google Maps photographs have not yet been identified.
Record exact share links and confirm their uploader before importing originals;
do not infer ownership from the place listing. See [research](docs/research.md)
for the research inventory and next capture work.

## Import your own panorama

The reusable tools live in `@foss-earth/sphere-image` and `@foss-earth/scenes`;
this repository exposes them without copying their implementation:

```sh
npm run download:panorama -- --help
npm run download:panorama -- --list
npm run download:panorama -- --photo-id YOUR_OWN_PHOTO_ID \
  --out build/anderson-original --prepare-out public/media/anderson-design-360 \
  --attribution "Photo by the photographer" \
  -- --asset-id anderson-design-360 --url-prefix media/anderson-design-360/
```

Google owner downloads need `STREETVIEW_PUBLISH_ACCESS_TOKEN` in the local
environment, with the `streetviewpublish` OAuth scope. It is never saved in the
repository. The existing Maps key is for viewing, not owner-download authority.
Use a local original or an explicitly permitted original URL when appropriate.
The output is **equi-angular cube tiles (EAC)**, with preview cubes and a whole
equirectangular fallback. Additional preparation arguments follow `--`.

To retain a prepared photo in this generated tour, copy its
`asset.fragment.json` into `content/imports/` and append this input to the
`imports` array in `content/tour.json` (use the actual capture coordinates):

```json
{
  "fragment": "content/imports/anderson-design-360.json",
  "id": "anderson-design-360",
  "title": "Anderson Design Lab",
  "latitudeDeg": 44.9755,
  "longitudeDeg": -93.233224,
  "mediaBaseUrl": "https://umn-vr.github.io/tour/makerspaces/",
  "groupId": "east-bank"
}
```

Those example coordinates are the building marker, not a verified capture
position. Replace them before importing. Then run `npm run build:scene` and
add the `panoramaId` to the corresponding entry in `content/spaces.json`.
The generated scene preserves attribution/orientation and leaves unmeasured
capture height null. The image files must be published with the prototype.

`npm run add:image -- --help` also builds standalone scene drafts from fragments;
use authoring inputs above for this generated tour. See the shared
download/import guide at `foss-earth/sphere-image/docs/download-and-import.md`
for source, authorization and preparation details. The shared Add image,
authoring and download APIs are under development in the adjacent FOSS Earth
checkouts; this prototype is built against those local sources.

## Checks and publishing

Keep changes local for the user's own testing. Push source or run a deployment
only when the user explicitly requests that specific action; these commands are
documentation, not authorization. Agent browser tests do not replace user testing.

```sh
npm test
npm run build
npm run deploy -- --dry-run
npm run deploy
```

Publishing uses an alternate Git index in the sibling `tour` checkout and
overlays only `makerspaces/` in its current remote `gh-pages` tree. It checks
every changed path before a normal fast-forward push. Existing pages, shared
assets and media remain byte-for-byte unchanged; old makerspaces assets stay
available for open tabs. No whole-tour build, service-worker update or homepage
deploy is performed. Push access to `UMN-VR/tour` is required. Source is pushed
separately to `UMN-VR/makerspaces`.

See [embedding](docs/embedding.md) for the proposed makers.umn.edu iframe and
the later step of adding a tour-selector link. Neither integration is enabled
by this prototype.

## License and credits

Code is [AGPL-3.0-only](LICENSE). University photographs retain their original
copyright, **© Regents of the University of Minnesota**, and are not relicensed
by the code license. No University endorsement is implied. Building placement
provenance and source credits are retained in `scene.json`. Review image reuse
and branding with UMN before institutional launch.
