# Opera Add-ons listing

- **Name** AutoReject Privacy
- **Version** 0.2.0
- **Category** Productivity
- **License** MIT
- **Support** https://github.com/zetH888/AutoReject-Privacy/issues
- **Privacy policy** https://github.com/zetH888/AutoReject-Privacy/blob/main/PRIVACY.md

## English

**Summary** Automatically decline optional consent on supported websites.

AutoReject Privacy looks for recognized consent controls and declines optional consent where it can identify the choices. Open the toolbar panel to see whether automation is active for the current site or to pause it for that hostname. If you enable local history, the panel shows recent actions and distinguishes a verified refusal from a submission still awaiting verification.

Coverage varies by consent provider, language and site configuration. The toolbar panel is in Polish. Settings and optional history stay in the browser.

## Polski

**Krótki opis** Automatycznie odrzucaj opcjonalne zgody na obsługiwanych witrynach.

AutoReject Privacy wyszukuje rozpoznane kontrolki formularzy zgód i odrzuca opcjonalne cele tam, gdzie może jednoznacznie ustalić wybór. Otwórz panel na pasku narzędzi, aby zobaczyć stan automatyzacji na bieżącej stronie lub wstrzymać ją dla tej domeny. Opcjonalna historia odróżnia potwierdzone odrzucenie od wysłania wyboru bez potwierdzenia zapisu.

Zakres działania zależy od dostawcy formularza, języka i konfiguracji witryny. Ustawienia i opcjonalna historia pozostają w przeglądarce.

## Reviewer notes

- The content script needs access to HTTP and HTTPS pages to find and operate the consent dialog where it appears. It uses recognizable controls within known consent provider containers.
- The popup uses `activeTab` to read the current site's hostname when opened. The `storage` permission keeps settings and optional history locally.
- Recommended manual checks are Cookiebot's home page and the Didomi CMP sandbox. On Cookiebot, confirm that preferences, statistics and marketing are off in **Cookie settings**. In Didomi, check the stored selections in **Privacy preferences** after reloading.
- The MIT license is included at the package root. Use screenshots of the actual 0.2.0 build showing the toolbar popup and a consent result. Opera recommends 612 × 408 pixels and accepts up to 800 × 600 pixels. [Publishing guidelines](https://help.opera.com/en/extensions/publishing-guidelines/)
