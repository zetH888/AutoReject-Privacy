# AutoReject Privacy

Open-source Opera GX / Chromium Manifest V3 extension to reject optional tracking consent where safely supported.

> **Status: v0.1.0 proof of concept.** This is not a production-grade privacy guarantee. Test locally before relying on it. CMP coverage is limited and legitimate-interest objections are **not yet reliably implemented**.

## Default configuration

| Setting | Default |
| --- | --- |
| Protection | `max` |
| Auto-confirm | `true` |
| Legitimate-interest objection | `true` (requested, implementation pending) |
| Notifications | `false` |
| Local history | `true` (last 200 actions) |

## Layout

```text
AutoReject-Privacy/
├── Engine/
│   ├── manifest.json
│   ├── background/
│   ├── content/
│   ├── ui/
│   ├── tools/
│   ├── tests/
│   └── package.json
├── .github/workflows/ci.yml
├── README.md
├── LICENSE
├── CHANGELOG.md
└── .gitignore
```

## Build and install in Opera GX

Requires Node.js 20+.

```bash
cd Engine
npm test
npm run build
```

Open `opera://extensions`, enable Developer Mode, select **Load unpacked** and choose the generated **`Engine/dist/`** directory. Browser permission: `storage`; content script runs on HTTP(S) pages, including supported frames.

## Current behavior

- Detects known CMP containers for OneTrust, Cookiebot, Didomi and selected Usercentrics layouts.
- Clicks an explicit **reject-all** control when unambiguously identified.
- For recognized panels only, attempts to disable checked, non-required checkbox inputs. Saves only when it changed some toggles and finds a precise save-choices label.
- Watches DOM mutations, supports open shadow roots and frames where content scripts are permitted.
- Stores compact history locally in `chrome.storage.local`; no analytics backend.
- Offers popup controls; switches for legitimate-interest and notifications are configured but have no fully implemented behavior yet.

## Safety and limitations

- Unrecognized dialogs are left untouched instead of guessing.
- Some vendors use closed Shadow DOM, cross-origin embedded frames, proprietary controls, or obscure consent storage, which may prevent rejection.
- Clicking "Reject all" does not necessarily include objections to every legitimate-interest processing purpose. The full TCF objection flow is a future milestone.
- Does not directly modify cookies, bypass paywalls, or claim to enforce privacy policies outside the visible UI.
- Local history contains site hostnames. Clear it from the popup whenever desired.
- `disabledHosts` can be configured in storage but has no popup editor yet.
- This proof of concept requires browser-based CMP integration testing before public release.

## Planned roadmap

1. Complete adapter-specific legitimate-interest rejection and UI preference handling.
2. Add fixture-driven integration and Playwright browser tests for each CMP and edge cases.
3. Build exclusion management, detailed adapter status, and opt-in diagnostics.
4. Audit permissions, accessibility, performance and vendor compatibility.
5. Package signed release artifacts and prepare store distribution.

## Development

`Engine/` is self-contained. The GitHub workflow executes tests and builds in that directory. `Engine/dist/` is generated and excluded from version control.

## License

MIT. See [LICENSE](LICENSE).
