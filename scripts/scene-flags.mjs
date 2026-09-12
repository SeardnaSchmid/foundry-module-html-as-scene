import { AUDIENCE, FLAGS, MODULE_ID, STACKING, TRUST } from "./constants.mjs";

const { BooleanField, StringField } = foundry.data.fields;

export function isExternalUrl(value) {
  return /^https?:\/\//i.test(value.trim());
}

export function resolveSource(value) {
  const source = value.trim();
  return isExternalUrl(source) ? source : foundry.utils.getRoute(source);
}

export function isMixedContent(value, protocol = window.location.protocol) {
  if ( protocol !== "https:" || !isExternalUrl(value) ) return false;
  try {
    return new URL(value).protocol === "http:";
  } catch (_error) {
    return false;
  }
}

export class HtmlSceneConfig extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      enabled: new BooleanField({ initial: false }),
      url: new StringField({ required: true, blank: true, initial: "" }),
      hideBoard: new BooleanField({ initial: true }),
      trust: new StringField({ initial: TRUST.STRICT, choices: Object.values(TRUST) }),
      stacking: new StringField({ initial: STACKING.BELOW, choices: Object.values(STACKING) }),
      interactive: new BooleanField({ initial: true }),
      audience: new StringField({ initial: AUDIENCE.ALL, choices: Object.values(AUDIENCE) })
    };
  }

  static forScene(scene) {
    const raw = scene?.getFlag(MODULE_ID, FLAGS.CONFIG) ?? {};
    try {
      return new this(raw);
    } catch (error) {
      console.warn(`${MODULE_ID} | Invalid scene configuration; using defaults.`, error);
      return new this({});
    }
  }

  get active() {
    return this.enabled && Boolean(this.url.trim());
  }

  get visibleToMe() {
    if ( this.audience === AUDIENCE.GM ) return game.user.isGM;
    if ( this.audience === AUDIENCE.PLAYERS ) return !game.user.isGM;
    return true;
  }

  get external() {
    return isExternalUrl(this.url);
  }

  get src() {
    return resolveSource(this.url);
  }

  get renderKey() {
    return `${this.trust}\u0000${this.external ? "external" : "local"}\u0000${this.src}`;
  }
}
