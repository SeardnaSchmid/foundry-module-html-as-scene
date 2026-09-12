import {
  CONFIG_KEYS,
  FLAGS,
  I18N,
  SCENE_CONFIG,
  TRUST,
  configFlagPath
} from "./constants.mjs";
import { HtmlSceneConfig, isExternalUrl, isMixedContent, resolveSource } from "./scene-flags.mjs";

export function registerSceneConfigTab() {
  const SceneConfig = foundry.applications.sheets.SceneConfig;
  if ( !SceneConfig.TABS.sheet.tabs.some((tab) => tab.id === SCENE_CONFIG.PART) ) {
    SceneConfig.TABS.sheet.tabs.push({
      id: SCENE_CONFIG.PART,
      icon: "fa-solid fa-globe",
      label: I18N.TAB
    });
  }

  if ( SCENE_CONFIG.PART in SceneConfig.PARTS ) return;
  const { footer, ...parts } = SceneConfig.PARTS;
  SceneConfig.PARTS = {
    ...parts,
    [SCENE_CONFIG.PART]: { template: SCENE_CONFIG.TEMPLATE, scrollable: [""] },
    footer
  };
}

export function enhanceSceneConfig(app, element) {
  const root = element.querySelector(`.tab[data-tab="${SCENE_CONFIG.PART}"]`);
  if ( !root ) return;

  const config = HtmlSceneConfig.forScene(app.document);
  const fields = new Map();
  for ( const control of root.querySelectorAll(`[${SCENE_CONFIG.FIELD_ATTRIBUTE}]`) ) {
    const key = control.getAttribute(SCENE_CONFIG.FIELD_ATTRIBUTE);
    if ( !CONFIG_KEYS.includes(key) ) continue;
    control.name = configFlagPath(key);
    if ( control.type === "checkbox" ) control.checked = config[key];
    else control.value = config[key];
    fields.set(key, control);
  }

  const enabled = fields.get("enabled");
  const updateDisabledState = () => {
    for ( const [key, control] of fields ) {
      if ( key !== "enabled" ) control.disabled = !enabled.checked;
    }
  };
  enabled.addEventListener("change", updateDisabledState);
  updateDisabledState();

  const trust = fields.get("trust");
  trust.addEventListener("change", async () => {
    if ( trust.value !== TRUST.TRUSTED ) return;
    trust.value = TRUST.STRICT;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: I18N.TRUST_CONFIRM_TITLE },
      content: `<p>${game.i18n.localize(I18N.TRUST_CONFIRM_CONTENT)}</p>`
    });
    if ( confirmed ) trust.value = TRUST.TRUSTED;
  });

  const url = fields.get("url");
  const validation = root.querySelector("[data-url-validation]");
  let validationRequest = 0;
  const validateUrl = async () => {
    const request = ++validationRequest;
    const value = url.value.trim();
    validation.hidden = true;
    validation.textContent = "";
    if ( !value ) return;

    if ( isMixedContent(value) ) {
      validation.textContent = game.i18n.localize(I18N.MIXED_CONTENT);
      validation.hidden = false;
      return;
    }
    if ( isExternalUrl(value) ) {
      try {
        new URL(value);
      } catch (_error) {
        validation.textContent = game.i18n.localize(I18N.INVALID_URL);
        validation.hidden = false;
      }
      return;
    }

    try {
      const response = await fetch(resolveSource(value), { method: "HEAD", credentials: "same-origin" });
      if ( request !== validationRequest ) return;
      if ( response.ok ) return;
      validation.textContent = game.i18n.format(I18N.LOCAL_MISSING, { status: response.status });
    } catch (_error) {
      if ( request !== validationRequest ) return;
      validation.textContent = game.i18n.localize(I18N.LOCAL_UNREACHABLE);
    }
    validation.hidden = false;
  };

  url.addEventListener("change", validateUrl);
  url.addEventListener("blur", validateUrl);
  void validateUrl();
}

export function sceneConfigChanged(changed) {
  return foundry.utils.hasProperty(changed, FLAGS.ROOT)
    || foundry.utils.hasProperty(changed, FLAGS.DELETED_ROOT)
    || Object.hasOwn(changed, "active");
}
