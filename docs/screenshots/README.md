# Screenshots

The main README references two images from this folder that are not included yet — this sandbox
has no network access, so the app could not be run and captured here:

- `hero.png` — a wide capture of the **Live Mission** screen (map + payload feed + event log) for
  the top of the README.
- `live-mission.png` — a capture of the same screen for the **Ground Command Centre** section,
  can be the same image as `hero.png` if you'd rather keep one shot.

To fill them in:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, log in with the demo credentials in the README, land on **Live
Mission**, and take a screenshot at a wide viewport (around 1440×900 matches the layout contract).
Save it into this folder with the filenames above and the README will pick it up automatically —
GitHub renders local image paths in Markdown directly.
