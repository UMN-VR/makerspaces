# Makerspaces tour research

Checked 2026-10-22. This is an independent, unlisted prototype based on public University information. It does not imply University endorsement, and there has been no outreach to the University or the lab teams.

## Directory coverage

The scope comes from the [UMN Makers directory](https://makers.umn.edu/). Each room or distinct Libraries location becomes its own stop in `content/spaces.json`. The prototype covers all twelve resulting stops. Operating hours are deliberately linked rather than copied, because they vary by term and some pages still show summer hours.

| Stop | Verified location | Current primary source |
| --- | --- | --- |
| Anderson Design Lab | Mechanical Engineering 2-134 | [Anderson hours and locations](https://cse.umn.edu/andersonlabs/hours-and-locations) |
| Anderson Build Lab | Civil Engineering 335 | [Anderson hours and locations](https://cse.umn.edu/andersonlabs/hours-and-locations) |
| Polaris Student Machine Shop | Mechanical Engineering 176 | [Anderson hours and locations](https://cse.umn.edu/andersonlabs/hours-and-locations) |
| Exceed Lab | Keller 2-160 and 2-164 | [Exceed](https://sites.google.com/umn.edu/exceed/home) |
| Bakken Medical Devices Center | Mayo Memorial Building G217 | [BMDC location](https://med.umn.edu/bmdc/about-us/location) and [training](https://med.umn.edu/bmdc/facilities/access-training) |
| Health Sciences Library Makerspace | HSEC 5-101 | [Directory](https://makers.umn.edu/) gives the room; [Libraries](https://www.lib.umn.edu/spaces/makerspaces) confirms the fifth floor |
| The Toaster Makerspace | Walter Library basement | [Libraries Makerspaces](https://www.lib.umn.edu/spaces/makerspaces) |
| Rapson Fabrication Shops | Laser lab 127; metal shop 127B; materials store 129; woodshop 139 | [Design Fabrication Shops](https://design.umn.edu/designfab) |
| AISOS | Heller Hall 431 | [AISOS location](https://aisos.umn.edu/visit) and [capabilities](https://aisos.umn.edu/) |
| eStudio | Regis Center for Art West W206 | [Department of Art facilities](https://cla.umn.edu/art/about/facilities) |
| XYZ Lab | Regis Center for Art East E125 | [XYZ Lab](https://xyzlab.umn.edu/) |
| McNeal Laser Lab | McNeal 334A; Free Fabric Room 334B | [Design Fabrication Shops](https://design.umn.edu/designfab) |

The current Anderson page calls the Machine Shop the **Polaris Student Machine Shop**. The broader directory still uses “Machine Shop.” The Exceed site also mentions access to Keller 2-149 for trained users, while its headline and the Makers directory list 2-160 and 2-164. The prototype retains those directory rooms. The Design page provides more detail than the Makers directory for Rapson and identifies McNeal 334B as the Free Fabric Room. It also describes College of Design course enrollment for shop access, so the prototype links to the current access policy rather than repeating the directory's broader “all are welcome” claim.

The old `bmdc.umn.edu` directory destination redirects to [med.umn.edu/bmdc](https://med.umn.edu/bmdc). BMDC's location page states that an appointment confirmation email is needed to navigate Mayo security. Lab access and equipment training are separate from viewing this prototype.

## Collected reference photographs

Three real photographs were downloaded unchanged from the official Anderson page into `public/media/`. The download manifest [ATTRIBUTION.json](../public/media/ATTRIBUTION.json) records original URLs, source captions, dimensions, file sizes and SHA-256 hashes. All three were visually inspected. None is a panorama.

| Local file | What it shows | Official original |
| --- | --- | --- |
| `anderson-design.jpg` | Students at shared wooden workbenches in the Design Lab; 4032 × 3024 | [Live-stream.jpg](https://cse.umn.edu/sites/cse.umn.edu/files/Live-stream.jpg) |
| `anderson-build.jpg` | Build Lab tables, workbenches and equipment; 3264 × 2448 | [Spaces.JPG](https://cse.umn.edu/sites/cse.umn.edu/files/Spaces.JPG) |
| `anderson-machine.jpg` | Students observing a waterjet cutter; 640 × 424 | [29234079134_7f3ed93dc7_z.jpg](https://cse.umn.edu/sites/cse.umn.edu/files/29234079134_7f3ed93dc7_z.jpg) |

Each photo is displayed on [Anderson's hours and locations page](https://cse.umn.edu/andersonlabs/hours-and-locations) under the corresponding lab section. The source page carries **© Regents of the University of Minnesota. All rights reserved.** It does not identify the photographers or provide an open reuse license. The prototype credit reproduces that source notice; it is not a claim of independently verified photographic authorship. The code license does not relicense these photographs. Collection at the user's request does not itself establish redistribution permission. Rights review remains necessary before wider distribution or official University embedding.

The file named `Live-stream.jpg` is a static JPEG. Its source caption does not make it a live camera feed. These images must remain normal, labeled reference photographs and must not be projected onto a sphere or presented as the user's own photos.

Other official image leads, not downloaded in this pass:

- [Libraries Makerspaces](https://www.lib.umn.edu/spaces/makerspaces): HSL overview, Toaster overview and equipment images. Example originals: [HSL overview](https://www.lib.umn.edu/sites/www.lib.umn.edu/files/2024-11/recently-saved-1-1.jpeg), [Toaster overview](https://www.lib.umn.edu/sites/www.lib.umn.edu/files/2023-12/breakerspace.jpeg). These URLs come from the page's image links; originals and rights still need checking.
- [Design Fabrication Shops](https://design.umn.edu/designfab): workshop overview, [official image URL](https://design.umn.edu/sites/design.umn.edu/files/2020-11/umn_design_may2018_0742.jpeg). The source does not establish that this photograph shows McNeal; do not reuse it as a McNeal room photo.
- [BMDC Prototyping Labs](https://med.umn.edu/bmdc/facilities/prototyping-labs): separate electronics, experimental, mechanical and AR/VR lab photographs.
- [Anderson's 2020 PPE story](https://cse.umn.edu/college/news/anderson-labs-lends-hand-fight-covid-19): explicitly credits Ben Guengerich. Historical event images are unsuitable as undated current room views.

## 360 imagery and Google Maps follow-up

- The Toaster stop references the existing tour panorama ID `the-toaster-innovation-hub`. This reuses an actual existing scene; it does not create new photographic coverage.
- The [official XYZ Lab site](https://xyzlab.umn.edu/) links “Take a virtual 360 tour of the Regis Center for Art” to [this Kuula collection](https://kuula.co/share/collection/7lyjr?chromeless=0&fs=1&logo=0&sd=1&thumbs=1&vr=0). This is a verified external 360 lead. The collection was not downloaded, its authorship/license was not inspected, and coverage of a particular XYZ or eStudio room has not been confirmed. An external link can preserve the provider's presentation while those details are reviewed.
- Searches for the Anderson Student Innovation Labs Google Maps profile and Felipe Galindo's contributions did not establish an exact photograph URL, panorama ID or contributor credit. The user remembers contributing a couple of photos; that remains a lead, not verified ownership or 360 coverage. Ask for the specific Maps share links or original image files, then check projection, resolution and attribution before importing them.
- [A third-party directory listing](https://www.3dprintops.com/services/anderson-student-innovation-labs-design-lab) provides a Maps search at 44.9755, -93.233224, but that alone does not locate an Anderson photo sphere. Public Maps HTML searches returned no usable contributor or photo identifiers, and a browser was unavailable in this session. No account-specific Maps activity was accessed.

## Verified building markers

These are building coordinates encoded by links from official campus map pages, **not room locations, camera positions or panorama coordinates**. Keep them separate from any later 360 capture coordinates.

| Building | Coordinates (latitude, longitude) | Evidence |
| --- | --- | --- |
| Mechanical Engineering | 44.9755, -93.233224 | [Official page](https://campusmaps.umn.edu/mechanical-engineering) links [Google Maps](https://maps.app.goo.gl/4T73V5jq4JRAygHh7) |
| Civil Engineering | 44.9761189, -93.2310933 | [Official page](https://campusmaps.umn.edu/civil-engineering-building) links [Google Maps](https://maps.app.goo.gl/aXT2kS85VYzFEojJ7) |

Mechanical Engineering's official address is 111 Church Street SE; Civil Engineering's is 500 Pillsbury Drive SE. No unverified geographic coordinates have been added to the prototype content.

## Before an official embed

Confirm the exact Anderson contributor photographs or obtain new captures, review each asset's reuse rights, confirm current room names and access information with University maintainers, and verify that the eventual host permits framing on `https://makers.umn.edu`. Keep the existing `/tour` entry unchanged until the prototype is approved for linking. No University page or third-party tour has been modified.
