# HTML as Scene

Blendet eine HTML-Seite als vollflächiges Overlay über den Foundry-Canvas ein,
sobald die zugehörige Szene aktiv ist. Die Szene bleibt eine echte
Foundry-Szene: Navigation, Rechte und Szenenwechsel funktionieren unverändert —
die Seite liegt nur darüber.

Erster Anwendungsfall ist die Orbitalkarte aus
[`tno-orbital-map`](https://github.com/SeardnaSchmid/tno-orbital-map), die damit
ohne zweiten Bildschirm am Spieltisch läuft. Das Modul selbst kennt sie nicht:
es zeigt, was in der Szene als URL steht.

> **Status: Gerüst.** Manifest, Release-Weg und Werkzeuge stehen. `scripts/`
> ist bewusst leer — der Modulcode wird von Grund auf geschrieben. Bis
> `scripts/module.mjs` existiert, schlägt `npm run check` fehl, und zwar zu
> Recht: das Manifest verspricht einen Einstiegspunkt, den es noch nicht gibt.

## Aufbau

Kursive Zeilen sind geplant, aber noch nicht geschrieben.

| Datei | Aufgabe |
| --- | --- |
| `module.json` | Manifest, Kompatibilität, Sprachen, Release-URLs |
| *`scripts/module.mjs`* | *Einstiegspunkt, verdrahtet nur Hooks* |
| *`scripts/constants.mjs`* | *Jede magische Zeichenkette an einem Ort* |
| *`scripts/overlay.mjs`* | *Das eine Iframe: öffnen, schließen, positionieren, messaging* |
| *`scripts/scene-flags.mjs`* | *Lesen/Schreiben der Szenen-Flags* |
| *`scripts/scene-config.mjs`* | *Zusätzlicher Reiter im Szenen-Sheet* |
| *`scripts/settings.mjs`* | *Welt- und Client-Einstellungen* |
| *`scripts/socket.mjs`* | *Reload/Payload an alle Clients* |
| *`scripts/api.mjs`* | *Öffentliche Schnittstelle für Makros* |
| *`scripts/utils.mjs`* | *Logging, Settings, URL- und Origin-Prüfung* |
| `templates/scene-config.hbs` | Markup des Szenen-Reiters (Gerüst) |
| `styles/html-as-scene.css` | Stapelung, Pointer-Events, Zustände |
| `lang/en.json`, `lang/de.json` | Übersetzungen |
| `tools/check-manifest.mjs` | Prüft das Manifest gegen die Dateien auf der Platte |
| `tools/package.mjs` | Release-Zip lokal bauen |
| `tools/link-foundry.mjs` | Arbeitskopie in die Foundry-Datenverzeichnis verlinken |
| `tools/serve-foundry.mjs` | Lokale Foundry-Instanz starten |
| `.release-it.json` | Versionsstand, Changelog, Tag |
| `.github/workflows/release.yml` | Baut und veröffentlicht das Release |

## Konfiguration pro Szene

Als Szenen-Flags unter `flags["html-as-scene"]`:

- `enabled` — Overlay für diese Szene an
- `url` — absolute URL oder Pfad relativ zum Foundry-Origin
  (z. B. `modules/html-as-scene/dist/index.html`)
- `interactive` — Klicks erreichen die Seite statt des Canvas
- `allowPlayers` — auch für Nicht-GMs sichtbar
- `hideCanvas` — Canvas vollständig verdecken

## Welt-Einstellungen

`allowedOrigins`, `sandbox`, `zIndex`, `debug` — siehe `scripts/settings.mjs`.

## Makro-Schnittstelle

```js
const api = game.modules.get("html-as-scene").api;
api.reload(true);                 // auf allen Clients neu laden
api.post({ action: "focus", body: "mars" }, true);
api.toggle();                     // kurz auf den Canvas schauen
```

Die Seite spricht per `postMessage` zurück; eingehende Nachrichten werden
gegen `allowedOrigins` geprüft und als Hook `html-as-scene.message` verteilt.

## Entwickeln

```bash
npm run link     # Data/modules/html-as-scene -> diese Arbeitskopie
npm run serve    # lokale Foundry-Instanz (FOUNDRY_APP_PATH/-DATA_PATH/-WORLD)
npm run check    # Manifest gegen die Dateien auf der Platte prüfen
npm run package  # module.zip lokal bauen, wie es die CI baut
```

## Release

Aufbau übernommen vom TNO-System (`foundry-joster-system`): der Tag ist die
Wahrheit, die CI baut alles andere.

```bash
npm install            # einmalig, für release-it
npm run release        # bump, Changelog, Commit, Tag, push
```

Der Tag `v1.2.3` löst
[`.github/workflows/release.yml`](.github/workflows/release.yml) aus:
`module.json` auf Version und Release-URLs umschreiben, Manifest prüfen,
`module.zip` packen, Release anlegen. Die Version niemals von Hand in
`module.json` ändern.

Manifest-URL für Foundry:

`https://github.com/SeardnaSchmid/foundry-module-html-as-scene/releases/latest/download/module.json`

### Die Seite selbst

Das Release enthält keine Seite — ausgeliefert wird nur das Modul. Für die
Orbitalkarte gibt es zwei Wege:

- die Pages-Ausgabe des Karten-Repos als URL in der Szene eintragen, oder
- eine gebaute Einzeldatei lokal nach `dist/index.html` legen; `npm run package`
  packt sie mit ein, die CI nicht (`dist/` ist in `.gitignore`).

## Nächste Schritte

1. `scripts/constants.mjs` — Flags, Settings-Keys, Socket-Typen, DOM-Ids.
2. `scripts/module.mjs` — Einstiegspunkt, damit `npm run check` wieder grün ist.
3. Overlay, Szenen-Reiter und Settings, in dieser Reihenfolge.
4. Gegen Foundry v14 mit der Orbitalkarte als Testseite prüfen.
