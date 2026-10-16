<div align="center">

<img src="docs/logo.svg" width="96" alt="Taksu Tech reception robots logo">

# Taksu Reception Robots kiosk

**The screen app of Taksu Tech's reception robots: the 13.3-inch screens on Snow and Timo and the
24-inch Taksu Kiosk totem, with queue tickets, a guest book, directions, a robot that listens and
answers aloud, and Aksara Bali on every sign and slip. In Indonesian and English.**

[![CI](https://github.com/DarmawanWeb/reception-robot-kiosk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/DarmawanWeb/reception-robot-kiosk/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/DarmawanWeb/reception-robot-kiosk?label=release&color=26338a)](https://github.com/DarmawanWeb/reception-robot-kiosk/releases)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6%20strict-3178C6?logo=typescript&logoColor=white)
![AI](https://img.shields.io/badge/AI-offline%20%7C%20Ollama%20%7C%20Anthropic%20%7C%20OpenAI--compatible-1d7466)
![Aksara Bali](https://img.shields.io/badge/Aksara-Bali-e6bd52)
![Languages](https://img.shields.io/badge/UI-Indonesia%20%7C%20English-e6bd52)
[![License](https://img.shields.io/badge/license-proprietary-26338a)](LICENSE)

[Features](#features) · [Structure](#structure) · [Documentation](#documentation) · [Develop](#develop)

</div>

---

Part of [Taksu Tech](https://github.com/DarmawanWeb/TaksuTech), which deploys it as `kiosk` at
[taksu-kiosk.agus-darmawan.com](https://taksu-kiosk.agus-darmawan.com), next to the
[speech service](https://github.com/DarmawanWeb/reception-robot-speech). The screen runs locked to
this one full-screen app, hence the name. Next.js 16 (App Router), React 19, Tailwind 4,
next-intl, zod, and qrcode. Robots and venues come from `@taksu/content` in the workspace, so this
repository builds inside it, as `apps/kiosk`.

Guest book entries, queue counters, and Studio settings stay in the browser. Without a model or
the speech service, the robot answers from the venue's data and speaks with the browser's voice.

## Features

**Screens**
- Sizes follow the short side of the screen: a 16 px base on the 13.3-inch landscape screens and
  24 px on the 24-inch portrait totem, where the nameplate, face, and content sit at the top and
  the menu, language, and voice buttons at the bottom, within reach.
- A waiting screen between the two halves of a candi bentar that starts in Indonesian or English,
  and a nameplate with Aksara Bali above the Latin, the time in WITA, and the Pawukon day.
  Switching language mid-task keeps the open screen; 90 seconds without a touch ends the visit.

**Errands**
- **Queue**: a ticket per service (`A-001`) with its counter and an estimated wait (the queue
  ahead is simulated in the demo).
- **Guest book**: a visitor pass with the name in Aksara Bali, the host, and a QR code.
- **Directions**: the route on the floor plan and steps in metres. Snow and Timo offer to walk the
  guest there; the Taksu Kiosk prints a route slip whose QR code opens the route on a phone.
- **About**, **organisation chart**, **your name in Aksara Bali**, and **Balinese customs**.

**Talk and ask**
- Push to talk, or a text chat. Answers come from the venue's data through one of four providers:
  offline (the default, no internet), Ollama, Anthropic, or any OpenAI-compatible API. Timeouts,
  errors, and visitors beyond the concurrency cap get offline answers; each IP has a rate limit.
- Whisper and Piper through the speech service, with the robot's mouth following the real voice;
  the browser's own speech while the service is absent or still loading.

**Print and demo**
- Tickets, visitor passes, route slips, and name keepsakes on 80 mm thermal paper (72 mm print
  width), under the venue's name in Aksara Bali, with QR codes generated on the device.
- A launcher with every robot at every sample venue, a totem preview for laptops
  (`/id/kiosk/kantor-layanan/preview`), and Studio, to try a kiosk under your own name.

## Structure

```
src/
  app/[locale]/           launcher, kiosk screen (/<robot>/<site>), totem preview, Studio
  app/api/                assistant, health, speech/health, stt, tts
  features/
    kiosk/                the screen: views, waiting screen, nameplate, clock, controls, idle timer
    voice/  assistant/    push-to-talk, server speech and lip-sync; the text chat
    queue/  guestbook/    tickets and visitor passes, numbered per Bali day
    wayfinding/           shortest route, turn-by-turn steps, floor plan
    about/  organization/  aksara/  culture/
    print/                the 80 mm slip, its Aksara Bali header, QR codes
    preview/  studio/     the totem frame; the custom kiosk builder
  server/                 AI providers, offline answers, rate limiter, speech service client
  lib/  i18n/             AI settings, locale helpers; routing for /id and /en
messages/                 id.json and en.json; a test keeps their keys equal
```

## Documentation

| Document | Contents |
|---|---|
| [Architecture](docs/architecture.md) | Stack, routes and screens, robots and venues, the feature folders, the assistant and its providers, voice and lip-sync, printing, Aksara Bali, API routes, configuration |
| [Development](docs/development.md) | Running inside the workspace, scripts, commits, recipes for a venue, a string, a provider or model, a paper width, and voice, design rules, CI |

## Develop

```bash
git clone --recursive https://github.com/DarmawanWeb/TaksuTech.git && cd TaksuTech
pnpm install                      # the workspace, plus the commit hooks in each submodule
cp apps/kiosk/.env.example apps/kiosk/.env.local
pnpm dev:kiosk                    # http://localhost:3001/id
pnpm --filter @taksu/kiosk test   # assistant, providers, speech client, queue, wayfinding, messages
```

Run the [speech service](https://github.com/DarmawanWeb/reception-robot-speech) on port 8000 and
set `SPEECH_URL=http://localhost:8000` in `.env.local` for Whisper and Piper. CI
([ci.yml](.github/workflows/ci.yml)) checks out the TaksuTech workspace, puts this commit at
`apps/kiosk`, and runs Biome, the typecheck, the tests, and the build. The images
(`ghcr.io/darmawanweb/reception-robot-kiosk`) are built by the workspace repository.

Proprietary. Copyright (c) 2026 Taksu Tech, part of Ezra Robotics. All rights reserved.
