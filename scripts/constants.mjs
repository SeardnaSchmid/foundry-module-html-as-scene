export const MODULE_ID = "html-as-scene";

export const FLAGS = Object.freeze({
  CONFIG: "config",
  ROOT: `flags.${MODULE_ID}`,
  DELETED_ROOT: `flags.-=${MODULE_ID}`
});

export const DOM_IDS = Object.freeze({
  BOARD: "board",
  OVERLAY: "html-as-scene-overlay"
});

export const CORE_SETTINGS = Object.freeze({
  NAMESPACE: "core",
  NO_CANVAS: "noCanvas"
});

export const CSS_CLASSES = Object.freeze({
  ABOVE_UI: "above-ui",
  ACTIVE: "html-as-scene-active",
  BOARD_HIDDEN: "html-as-scene-board-hidden",
  OVERLAY: "html-as-scene-overlay",
  PASSIVE: "passive"
});

export const CONFIG_KEYS = Object.freeze([
  "enabled",
  "url",
  "hideBoard",
  "trust",
  "stacking",
  "interactive",
  "audience"
]);

export const TRUST = Object.freeze({
  STRICT: "strict",
  TRUSTED: "trusted"
});

export const STACKING = Object.freeze({
  BELOW: "below",
  ABOVE: "above"
});

export const AUDIENCE = Object.freeze({
  ALL: "all",
  GM: "gm",
  PLAYERS: "players"
});

export const SANDBOX = Object.freeze({
  [TRUST.STRICT]: "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
  [TRUST.TRUSTED]: null
});

export const HOOKS = Object.freeze({
  SHOWN: "htmlAsSceneShown",
  HIDDEN: "htmlAsSceneHidden"
});

export const SCENE_CONFIG = Object.freeze({
  PART: MODULE_ID,
  FIELD_ATTRIBUTE: "data-config-key",
  TEMPLATE: `modules/${MODULE_ID}/templates/scene-config.hbs`
});

export const I18N = Object.freeze({
  INVALID_URL: `${MODULE_ID}.validation.invalidUrl`,
  LOAD_TIMEOUT: `${MODULE_ID}.notifications.loadTimeout`,
  LOCAL_LOAD_FAILED: `${MODULE_ID}.notifications.localLoadFailed`,
  LOCAL_MISSING: `${MODULE_ID}.validation.localMissing`,
  LOCAL_UNREACHABLE: `${MODULE_ID}.validation.localUnreachable`,
  MIXED_CONTENT: `${MODULE_ID}.validation.mixedContent`,
  OVERLAY_TITLE: `${MODULE_ID}.overlay.title`,
  TAB: `${MODULE_ID}.sceneConfig.tab`,
  TRUST_CONFIRM_CONTENT: `${MODULE_ID}.trust.confirmContent`,
  TRUST_CONFIRM_TITLE: `${MODULE_ID}.trust.confirmTitle`
});

export const LOAD_TIMEOUT_MS = 10_000;

export function configFlagPath(key) {
  return `${FLAGS.ROOT}.${FLAGS.CONFIG}.${key}`;
}
