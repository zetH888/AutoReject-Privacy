# AutoReject Privacy

Open-source Opera GX / Chromium Manifest V3 extension to reject optional tracking consent where safely supported.

> **Status: v0.2.0 beta.** The extension supports selected consent dialogs. Coverage and legitimate-interest objections depend on the controls exposed by the website.

## Default configuration

| Setting | Default |
| --- | --- |
| Protection | `max` |
| Auto-confirm | `true` |
| Legitimate-interest objection | `true` (requested, implementation pending) |
| Local history | Off for new installations. Existing choices are preserved |

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

Open `opera://extensions`, enable Developer Mode, select **Load unpacked** and choose the generated **`Engine/dist/`** directory. The extension requests `storage` for local settings and optional history and `activeTab` to identify the current site when you open the popup. Its content script runs on HTTP(S) pages, including supported frames.

## Current behavior

- Detects known CMP containers for OneTrust, Cookiebot, Didomi and selected Usercentrics layouts.
- Clicks an explicit **reject-all** control when unambiguously identified.
- On supported Didomi preferences panels, opens the settings, selects explicit refusal controls and submits only when every visible choice group is recognized and set to refusal.
- Cookiebot rejection is recorded as `rejected` when its saved consent cookie confirms all three optional categories are off. Other submissions are recorded as `submitted-unverified` pending verification of the saved state.
- Watches DOM mutations, supports open shadow roots and frames where content scripts are permitted.
- Stores compact history locally in `chrome.storage.local`; no analytics backend.
- Shows the current site's automation status and lets you pause or resume automation for that hostname. The latest recorded action is shown when history is enabled.

## Safety and limitations

- Unrecognized dialogs are left untouched instead of guessing.
- Some vendors use closed Shadow DOM, cross-origin embedded frames, proprietary controls, or obscure consent storage, which may prevent rejection.
- Clicking "Reject all" does not necessarily include objections to every legitimate-interest processing purpose. The full TCF objection flow is a future milestone.
- Does not directly modify cookies, bypass paywalls, or claim to enforce privacy policies outside the visible UI.
- Optional local history stores up to 200 actions, including site hostnames. You can stop recording or clear saved entries from the popup. See the [privacy policy](PRIVACY.md).
- This proof of concept requires browser-based CMP integration testing before public release.

## Planned roadmap

1. Complete adapter-specific legitimate-interest rejection and UI preference handling.
2. Add fixture-driven integration and Playwright browser tests for each CMP and edge cases.
3. Build exclusion management, detailed adapter status, and opt-in diagnostics.
4. Audit permissions, accessibility, performance and vendor compatibility.
5. Package signed release artifacts and prepare store distribution.

## Development

`Engine/` is self-contained. The GitHub workflow executes structure and consent regression tests and builds the extension in that directory. `Engine/dist/` is generated and excluded from version control.

## License

MIT. See [LICENSE](LICENSE).
