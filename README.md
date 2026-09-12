# HTML as Scene

HTML as Scene zeigt für eine Foundry-Szene eine Webseite anstelle der Karte.
Die Seite füllt die Ansicht; Foundrys Navigation, Sidebar, Hotbar und Fenster
funktionieren weiter. Zielplattform ist ausschließlich Foundry VTT 14.

## Funktionen

- Konfiguration direkt im zusätzlichen Reiter **HTML** der Szeneneinstellungen
- externe HTTP(S)-Seiten und lokale HTML-Dateien unter Foundrys Data-Pfad
- Zielgruppe: alle, nur Spielleitung oder nur Spieler
- Foundry-Bedienelemente wahlweise über oder unter der Seite
- interaktive Seite oder durchgereichte Zeigereingaben zum Canvas
- optional ausgeblendeter Canvas zur Reduktion der Renderlast
- strikte Sandbox als Standard und ausdrücklich bestätigter Vertrauensmodus
- Unterstützung für Foundrys Einstellung **Canvas deaktivieren**

Die Konfiguration liegt unter `flags["html-as-scene"].config` an der Szene und
wird durch Foundry selbst an alle Clients verteilt. Das Modul verwendet keinen
eigenen Socket.

## Seite einrichten

In den Einstellungen einer Szene den Reiter **HTML** öffnen, die Anzeige
aktivieren und eine Quelle eintragen:

- extern: `https://example.org/table.html`
- lokal: `modules/html-as-scene/dist/index.html`

Foundry 14 liefert HTML-Dateien im Data-Verzeichnis absichtlich als Text aus.
Das Modul lädt lokale Quellen deshalb selbst und setzt sie als `srcdoc` in das
Iframe ein. Ein automatisch ergänztes `<base>` erhält relative Bild-, CSS- und
Script-Pfade. Ein bereits vorhandenes `<base>` wird nicht verändert.

Der Foundry-Dateidialog lädt keine `.html`-Dateien hoch. Lege lokale Seiten
daher direkt im Data-Verzeichnis ab. Für eine mit dem Modul gepackte Seite kann
beispielsweise `dist/index.html` verwendet werden; `dist/` ist absichtlich nicht
Teil des veröffentlichten Moduls.

## Sicherheit

**Strikte Sandbox** ist die Voreinstellung. Scripts, Formulare und Popups
funktionieren, die Seite erhält aber einen undurchsichtigen Origin und kann
nicht auf Foundrys DOM, Sitzung oder `window.parent.game` zugreifen.

**Vertrauenswürdig** entfernt die Sandbox. Bei einer lokalen `srcdoc`-Seite ist
das voller Zugriff auf Foundry. Diesen Modus nur für selbst kontrolliertes HTML
verwenden. Der Szenendialog verlangt beim Auswählen eine Bestätigung. Eine
Änderung des Vertrauensmodus lädt die Seite neu, damit die neue Sandbox wirklich
wirksam wird.

Eingebettete Seiten können Audio abspielen. Außerdem verweigern viele externe
Websites die Darstellung in Iframes über `X-Frame-Options` oder die
`frame-ancestors`-Regel ihrer Content Security Policy. Der Browser stellt dann
oft nur eine leere Fläche dar; das Modul kann diese Ablehnung nicht zuverlässig
von JavaScript aus erkennen. Eine GM-Warnung nach einem Lade-Timeout ist daher
nur ein bestmöglicher Hinweis. HTTP-Seiten werden von einem über HTTPS
erreichbaren Foundry als Mixed Content blockiert und bereits im Szenendialog
markiert.

## Hooks

Beim Anzeigen und Entfernen ruft das Modul diese Hooks auf:

```js
Hooks.on("htmlAsSceneShown", (overlay, config, scene) => {});
Hooks.on("htmlAsSceneHidden", (overlay, scene) => {});
```

ApplicationV2 stellt zusätzlich `renderHtmlAsSceneOverlay` und
`closeHtmlAsSceneOverlay` bereit.

## Bewusste Nicht-Ziele

Das Modul versteckt oder verschiebt Foundrys Oberfläche nicht, injiziert keine
Foundry-API in die Seite und bietet keine Socket-, `postMessage`-, Makro- oder
automatische Reload-Schnittstelle. Diese Funktionen benötigen ein eigenes
Sicherheits- und API-Design und gehören nicht zum ersten Release.

## Entwickeln

```bash
npm run link     # Arbeitskopie unter Data/modules/html-as-scene verlinken
npm run serve    # lokale Foundry-Instanz starten
npm run check    # Manifest und referenzierte Dateien prüfen
npm run package  # lokales module.zip bauen
```

## Release

`npm run release` aktualisiert die Version in `module.json` und `package.json`,
schreibt den Changelog, erzeugt den Commit und pusht ein `v*`-Tag. Das Tag löst
`.github/workflows/release.yml` aus; dort werden die Release-URLs gesetzt und
`module.json` sowie `module.zip` veröffentlicht. Die Version in `module.json`
nicht von Hand ändern.

Manifest-URL:

`https://github.com/SeardnaSchmid/foundry-module-html-as-scene/releases/latest/download/module.json`
