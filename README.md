# WonderNest · The Orchard Picnic

A real-time 3D orchard adventure with Nori and Mazidah, six open-ended story tasks, A–Z, counting 1–10, colours, shapes and sixteen two/three-letter words.

Open the published GitHub Pages link, then choose **Let’s help Mazidah**. Tap an object to make Nori walk to it and interact. Use the four large arrows and Jump for direct movement. HELP takes Nori to the next useful object; the action button completes that step. MORE opens every chapter. Nothing is timed or scored.

Voice, music, volume, reduced motion and a steady garden-view camera are available. STOP and BREAK pause the world and audio. No microphone or required speech. No account or tracking. Music volume/mute preferences are stored only on this device.

For a local preview, serve this folder over HTTP (the 3D model and textures load as local assets). With Python installed: run `python -m http.server 8080 --bind 127.0.0.1` from this folder, then open `http://127.0.0.1:8080`. Double-clicking index.html is not supported for 3D asset loading. The original standalone game remains available in the separate Alphabet & Number Adventures download.

To publish, copy this folder’s files to the GitHub Pages root, alongside the original game’s files. Keep the original index as classic.html. No build step is needed for the bundled orchard.js. All assets are served locally; there are no runtime CDN requests.

Rendering requires WebGL 2 and a reasonably recent mobile browser. If 3D cannot open, the original learning adventures are linked from the loading screen. Nori uses a licensed rigged fox base; Mazidah and the environment are procedural models with photographic terrain and sky assets. This is a 3D prototype, rather than film-quality photorealism. See ORCHARD-CREDITS.md for licenses and changes. No clinical-effectiveness claim.


## Gentle controls update
Soft sky-blue surround, mint controls, proportional touch joystick with dead zone and automatic release reset. Arrow controls remain available in Grown-up options; keyboard, tap-to-walk and HELP remain available. Starting quantities can be 1–3. Completed flower and gate tasks persist across the current picnic session. MORE includes a quiet garden with no task. Spoken recordings finish before the latest pending prompt, with a short pause between clips; STOP, BREAK and voice-off still silence immediately.
