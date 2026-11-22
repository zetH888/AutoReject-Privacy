# AutoReject Privacy

AutoReject Privacy to projekt rozszerzenia dla Opera GX i innych przeglądarek opartych na Chromium. Rozszerzenie ma rozpoznawać formularze zgód, odrzucać opcjonalne cele przetwarzania i zapisywać wybór użytkownika. Projekt zakłada Manifest V3 i przetwarzanie danych wyłącznie w przeglądarce, bez serwera i telemetrii.

## Status projektu

Repozytorium zawiera plan wydania `0.1.0`. Kod rozszerzenia, testy i paczka instalacyjna zostaną dodane w kolejnych etapach.

## Ustawienia domyślne

| Ustawienie | Wartość |
| --- | --- |
| Poziom ochrony | `max` |
| Automatyczne zatwierdzanie wyboru | Tak |
| Sprzeciw wobec uzasadnionego interesu | Tak |
| Powiadomienia | Nie |
| Lokalna historia działań | Tak |

W trybie `max` rozszerzenie ma odrzucać wszystkie rozpoznane opcjonalne cele. Sprzeciw wobec uzasadnionego interesu ma być składany tam, gdzie dany formularz udostępnia taką możliwość. Użytkownik będzie mógł wyłączyć automatyzację dla wybranych domen.

## Zasady działania

- Rozszerzenie działa tylko na jednoznacznie rozpoznanych kontrolkach formularza. W przypadku niejednoznaczności pozostawia wybór użytkownikowi.
- Ponowne skanowanie pozostawia wyłączone opcje w stanie `OFF` i pomija opcje wymagane.
- Wykrycie formularza, wykonanie wyboru i weryfikacja zapisu to odrębne etapy. Historia odnotowuje potwierdzony wynik, gdy stan formularza pozwala go zweryfikować.
- Ustawienia, wyjątki i historia są przechowywane lokalnie. Historia pomija treść stron, identyfikatory reklamowe i wartości plików cookie.

## Plan wydania `0.1.0`

1. Przygotować manifest, kompilację TypeScript i ustawienia lokalne.
2. Zbudować wykrywanie formularzy wczytywanych wraz ze stroną i dynamicznie oraz obsługę jednoznacznych przycisków odrzucenia.
3. Przygotować adaptery dla OneTrust, Cookiebot, Didomi i Usercentrics. Obsługę przełączników oraz sprzeciwu zweryfikować osobno dla każdego dostawcy.
4. Dodać panel ustawień, wyjątki dla domen i lokalną historię.
5. Sprawdzić działanie na przykładowych formularzach i ręcznie w Opera GX, a następnie przygotować paczkę instalacyjną.

Zakres obsługi zależy od wersji i konfiguracji formularza. Część formularzy działa w ramkach lub zamkniętych drzewach Shadow DOM. Sprzeciw wobec uzasadnionego interesu może wymagać dodatkowych kroków właściwych dla danego dostawcy.

## Docelowa struktura repozytorium

```text
AutoReject-Privacy/
├── Engine/
│   ├── manifest.json
│   ├── core/
│   ├── adapters/
│   ├── background/
│   ├── content/
│   ├── storage/
│   ├── ui/
│   ├── assets/
│   └── tests/
├── .github/
│   └── workflows/
├── README.md
├── LICENSE
└── .gitignore
```

`Engine/` zawiera kod, konfigurację kompilacji i testy rozszerzenia. Wynik kompilacji trafi do `Engine/dist/` i będzie można wczytać go jako rozszerzenie bezpośrednio w Opera GX. Główną gałęzią repozytorium jest `main`.

## Licencja

[MIT](LICENSE)
