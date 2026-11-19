# Preparing elf faces

Open `photo-studio.html` directly in your browser. It is a standalone local tool and is deliberately excluded from `dist/`.

1. Select the person and choose their photo (JPEG or PNG recommended).
2. Use zoom, horizontal/vertical position and straighten controls to fill the oval with their face. The checkerboard is transparent; it is not included in the portrait. This crops an oval, rather than detecting hair or removing a background automatically.
3. Save that face, then repeat for the other people. Export saved faces to download `photos.json`. Partial exports work; missing slots retain their demo emoji.
4. Move the export to `kris/private/photos.json`. Keep your original photos anywhere private; the build needs only this export. Avoid putting photographs in public `assets/`.
5. Run `npm run build` from `kris/`, then refresh http://localhost:4174 (start `npm run dev` if needed).

Re-import your export into the studio to resume. To change a crop, choose the original photograph again. The tool does not automatically save unsaved work when you close the page.

The current fictional demo slots are Emma → Holly, Jonny → Robin, Gerarda → Noel, Alan → Ivy, David → Jingle, Lindsay → Star. Photos do not rename participants, issue codes or create the real family draw.

The build encrypts all six cropped portraits separately for each existing code with a fresh AES-GCM nonce; assignments and codes are preserved. Any valid code can view the full cast. The JSON export stays ignored under `private/`; only ciphertext is published. Lock clears the loaded portrait array and removes the cast DOM. No automatic face-generation or third-party photo service is used.

## Real family mode

`npm run build:family` creates the real draw once (if absent), enforcing Emma/Jonny and David/Lindsay exclusions. It requires all six portraits. The saved draw is `private/family.json` and the distribution list is `private/family-codes.txt`. Both are private and ignored by Git. Back up this private folder securely: it contains the only durable draw and codes.

After the family draw exists, ordinary `npm run build` keeps using it without redrawing or changing codes. The roster is encrypted alongside the photographs; the six faces and names now match directly. `npm run build:demo` temporarily restores the fictional demo output for rehearsal; `npm run build:family` switches back to the same saved family draw. Do not distribute demo codes. Publishing requires preserving the saved encrypted draw; a fresh checkout alone cannot recreate the issued codes.
