# Development

## Setup

The kiosk builds inside the [TaksuTech](https://github.com/DarmawanWeb/TaksuTech) workspace,
which holds the lockfile and the shared packages (`@taksu/content`, `@taksu/ui`, `@taksu/bali`,
`@taksu/typescript-config`).

```bash
git clone --recursive https://github.com/DarmawanWeb/TaksuTech.git && cd TaksuTech
corepack enable                 # pnpm 10, Node 22.12 or newer
pnpm install                    # also points this submodule's git hooks at the workspace's
cp apps/kiosk/.env.example apps/kiosk/.env.local
pnpm dev:kiosk                  # http://localhost:3101/id
```

With the example settings the assistant answers offline from the venue data, and the kiosk
listens and speaks with the browser. Open a robot at a venue from the launcher, or the totem
preview at `/id/kiosk/kantor-layanan/preview`; on a phone held upright the preview opens the
kiosk screen directly.

## Scripts

Run from the workspace root (`pnpm --filter @taksu/kiosk <script>`) or from `apps/kiosk`.

| Script | Does |
|---|---|
| `dev` | Next.js dev server on port 3101 |
| `build`, `start` | Production build (standalone) and server, on port 3101 |
| `typecheck` | `next typegen`, then `tsc --noEmit` |
| `test` | Vitest: the offline assistant, Ollama against a stub server, the speech client against a stub service, the rate limiter, queue tickets, visitor passes, wayfinding, Studio settings, messages |
| `lint` | Biome lint |

`pnpm check` at the workspace root runs `biome ci .` and every typecheck and test.

## Commits

This is its own repository: commit inside `apps/kiosk` and push it here, then record the new
commit in the workspace (`git add apps/kiosk`, `chore: update kiosk`). The workspace's hooks run
here too: lint-staged formats the staged files with Biome, and commitlint checks the message
(Conventional Commits, lower-case subject; the history uses the `kiosk` scope). Releases are
tagged here. v1.0.0 is the version built in the Taksu Tech monorepo; its history came along when
the app moved here.

## Recipes

**A venue.**
1. Add a `KioskSite` next to `packages/content/src/sites/kantor-layanan.ts` in the workspace: the
   name in Latin (the kiosk writes the Aksara line), tagline, profile, facts, the organisation
   tree, queue services with their own prefixes, the floor map (nodes, corridors, rooms with a
   category and a door node, the robot's start, metres per map unit), the FAQ with keywords for
   offline answers, and notes on customs, all in `{ id, en }`. Keep `isSample: true` while the
   data is made up.
2. List it in `kioskSites` in `packages/content/src/sites/index.ts`. The launcher, the kiosk and
   preview routes, Studio, and the assistant pick it up.
3. `pnpm --filter @taksu/content test` checks that every room door can be reached from the start,
   that people and services point at real rooms, and that queue prefixes are unique.
4. Room ids with synonyms in `src/server/ai/intents.ts` (`toilet`, `restoran`, `pool`, `gym`,
   `tunggu`) are found by more words; add a line there for a new kind of room.

**A string.** Add the key to both `messages/id.json` and `messages/en.json`. The typecheck rejects
a key missing from `id.json` (the message type comes from it, in `src/types/next-intl.d.ts`), and
the messages test rejects files whose keys differ. What the robot says as a view opens is under
`Kiosk.lines`, menu titles and lines under `Kiosk.menu`. Venue text belongs in `@taksu/content`,
and brand names come in as `{brand}` from `names`, never typed.

**An assistant provider or model.** Set it in `.env.local` and restart `pnpm dev:kiosk`;
`/api/health` shows the provider in use, and an incomplete setup logs a warning and answers
offline.
- Ollama: create `taksu-asisten` with `infra/ollama/setup.sh` in the workspace, then set
  `AI_PROVIDER=ollama`. `AI_MODEL` picks another local model, `AI_BASE_URL` another host.
- Anthropic: `AI_PROVIDER=anthropic` and `AI_API_KEY`; `AI_MODEL` overrides the default.
- OpenAI-compatible: `AI_PROVIDER=openai`, `AI_MODEL`, and `AI_BASE_URL` for anything but OpenAI;
  `AI_API_KEY` when the API needs one.
- A new provider: a `(config, system, turns) => Promise<string>` function in
  `src/server/ai/providers/` that throws on failure (the caller then answers offline), its name in
  the enum in `src/lib/ai-config.ts`, a case in `modelReply` in `src/server/ai/index.ts`, and a
  test against a stub server, as in `ollama.test.ts`.

**Another paper width.** The paper is set in one place, the `@media print` block in
`src/app/globals.css`: `.print-slip` is `72mm` wide with `4mm` on each side, for 80 mm rolls. For
another roll, set the width to the printer's print width and the side margins to what is left.
The slip on screen (`max-w-[21rem]` in `src/features/print/print-slip.tsx`) is only the preview.

**Voice, locally.**
1. Run the [speech service](https://github.com/DarmawanWeb/reception-robot-speech) on port 8000.
   From its clone, with ffmpeg installed: `pip install -r requirements.txt`, then
   `SPEECH_MODELS_DIR=./models uvicorn app.main:app --port 8000`. It downloads its models on
   first start.
2. Set `SPEECH_URL=http://localhost:8000` in `apps/kiosk/.env.local` and restart `pnpm dev:kiosk`.
3. Wait until `http://localhost:3101/api/speech/health` shows `stt` and the `tts` voices as true,
   then reload the kiosk: it reads that answer when the screen loads, and the server keeps it for
   30 seconds. Until then the kiosk uses the browser's voice.
4. Open the Talk menu, allow the microphone, and press the mic. The line under it says whether the
   voice is processed on the local server or by the browser; with the server voice, the robot's
   mouth follows the audio.

## Design rules

- **Sizes in rem.** The root size follows the short side of the screen
  (`clamp(16px, 100vmin / 45, 28px)` in `globals.css`): 16 px on the 13.3-inch landscape screens
  (1280 x 720), 24 px on the 24-inch portrait totem (1080 x 1920). Size type, spacing, and touch
  targets in rem, so they grow with the screen.
- **Touch reach.** Use the `landscape:` and `portrait:` variants. On the totem, what is read sits
  at the top and what is touched at the bottom: nameplate, face, and content first, then a dock
  with the menu button, clock, sound, language, and full screen. Check portrait in the preview
  and landscape in a 1280 x 720 window.
- **Touch first.** The kiosk surface turns off text selection and long-press callouts, except in
  inputs. Actions use the large button size (`size="xl"`).
- **Bali theme.** Colours come from `@taksu/ui/theme.css`, named after Balinese materials: Paras
  stone (light background), Endek indigo (primary), Malam night (dark background), Prada gold
  leaf (primary in dark, ornaments), Subak water (calm accents). Snow's screen is light, Timo's
  and the Taksu Kiosk's dark. Use tokens (`bg-primary`, `bg-surface`, `text-muted-foreground`),
  not hex codes; the nameplate (`--board-*`) and the paper (`--paper-*`) have their own tokens in
  `globals.css`, and paper stays black on white in both themes.
- **Aksara above Latin** for every name the venue shows, through `Signboard` or `AksaraText`;
  lines that repeat Latin text already on screen are `decorative`, so screen readers skip them.
- **Motion** respects `prefers-reduced-motion`: the escort jumps straight to the room.
- **Names.** The reception line's brand name is still a placeholder, so read it from `names` in
  `@taksu/content`. Products carry the Taksu Tech label only, with no OEM brand names or model
  codes.

## CI

[ci.yml](../.github/workflows/ci.yml) checks out the TaksuTech workspace with its submodules,
replaces `apps/kiosk` with the commit under test, installs, and runs Biome, the typecheck, the
tests, and the build for `@taksu/kiosk`. On pull requests it also runs commitlint. Images
(`ghcr.io/darmawanweb/reception-robot-kiosk`) are built by the workspace repository.
