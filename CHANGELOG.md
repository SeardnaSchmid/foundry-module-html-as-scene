# Changelog

# [0.2.0](https://github.com/SeardnaSchmid/foundry-module-html-as-scene/compare/v0.1.0...v0.2.0) (2026-09-12)


### Features

* add scene snapshot bridge ([5947293](https://github.com/SeardnaSchmid/foundry-module-html-as-scene/commit/5947293bed3eaed4a86b5343e46ffeaea69a4ad2))

# 0.1.0 (2026-09-12)


### Bug Fixes

* avoid duplicate release version bump ([3474661](https://github.com/SeardnaSchmid/foundry-module-html-as-scene/commit/3474661e4dde04b64d3e098455c861dd2c0712c7))


### Features

* implement HTML scene webviews ([05e43c7](https://github.com/SeardnaSchmid/foundry-module-html-as-scene/commit/05e43c7cd82914b09243007b773c8156c5e9bcb0))

## [Unreleased]
- Optionale Snapshot-Brücke für eingebettete Seiten: lokaler Browser-Arbeitsstand,
  serverseitiger Szenen-Snapshot und Live-Aktualisierung ohne Seiten-Reload.
- Vollständige Szenen-Webansicht mit v14-Szenenreiter, Zielgruppen,
  Stapelung, Pointer-Modus, Canvas-Abschaltung und Lifecycle für Canvas- sowie
  No-Canvas-Welten.
- Externe URLs und lokale HTML-Seiten über `srcdoc`, inklusive relativer Assets,
  strikter Sandbox, bestätigtem Vertrauensmodus und Lade-/Pfadwarnungen.
- Release-Mechanismus nach Vorbild des TNO-Systems: tag-getriebene CI,
  `release-it`, Manifest-Prüfung, lokales Packen und Foundry-Verlinkung.
