import {
  BRIDGE,
  CSS_CLASSES,
  DOM_IDS,
  FLAGS,
  HOOKS,
  I18N,
  LOAD_TIMEOUT_MS,
  MODULE_ID,
  SANDBOX,
  STACKING
} from "./constants.mjs";
import { injectBridge, parseStoredValue } from "./bridge.mjs";

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

/** Add a base URL without disturbing an explicitly authored <base> element. */
export function injectBaseHref(html, sourceUrl) {
  if ( /<base\b/i.test(html) ) return html;

  const baseUrl = new URL(".", new URL(sourceUrl, document.baseURI)).href;
  const base = `<base href="${escapeAttribute(baseUrl)}">`;
  if ( /<head(?:\s[^>]*)?>/i.test(html) ) {
    return html.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}${base}`);
  }

  const doctype = html.match(/^\s*<!doctype[^>]*>/i);
  if ( doctype ) {
    const end = doctype.index + doctype[0].length;
    return `${html.slice(0, end)}<head>${base}</head>${html.slice(end)}`;
  }
  return `<head>${base}</head>${html}`;
}

export class HtmlAsSceneOverlay extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: DOM_IDS.OVERLAY,
    classes: [CSS_CLASSES.OVERLAY],
    tag: "div",
    window: { frame: false, positioned: false }
  };

  #config = null;
  #iframe = null;
  #loadTimer = null;
  #renderData = null;
  #renderKey = null;
  #request = 0;
  #scene = null;

  #onBridgeMessage = (event) => {
    if ( event.source !== this.#iframe?.contentWindow ) return;
    const message = event.data;
    if ( !this.#config?.bridge || message?.channel !== BRIDGE.CHANNEL || !message.requestId ) return;
    void this.#handleBridgeRequest(message);
  };

  async show(config, scene) {
    const request = ++this.#request;
    const wasRendered = this.rendered;
    const previousScene = this.#scene;
    const changed = config.renderKey !== this.#renderKey;

    if ( this.rendered && !changed ) {
      this.#config = config;
      this.#scene = scene;
      this.#applyBodyState(config);
      this.#applyElementState(config);
      this.#emitSceneChange(previousScene, scene, config);
      return this;
    }

    let html = null;
    if ( !config.external || config.bridge ) {
      try {
        const response = await fetch(config.src, { credentials: config.external ? "omit" : "same-origin" });
        if ( !response.ok ) throw new Error(`${response.status} ${response.statusText}`);
        html = injectBaseHref(await response.text(), config.src);
        if ( config.bridge ) html = injectBridge(html, this.#bridgeContext(config, scene));
      } catch (error) {
        if ( request !== this.#request ) return this;
        console.error(`${MODULE_ID} | Failed to fetch HTML from ${config.src}.`, error);
        if ( game.user.isGM ) {
          const key = config.external ? I18N.BRIDGE_FETCH_FAILED : I18N.LOCAL_LOAD_FAILED;
          ui.notifications.error(game.i18n.format(key, { url: config.url }));
        }
        await this.hide();
        return this;
      }
    }

    if ( request !== this.#request ) return this;
    this.#config = config;
    this.#renderData = { config, html };
    this.#scene = scene;
    this.#applyBodyState(config);
    await this.render({ force: true });
    if ( request !== this.#request ) return this;
    this.#renderKey = config.renderKey;
    if ( !wasRendered || previousScene?.id !== scene?.id ) this.#emitSceneChange(previousScene, scene, config);
    return this;
  }

  async hide() {
    const request = ++this.#request;
    this.#clearLoadTimer();
    document.body.classList.remove(CSS_CLASSES.ACTIVE);
    document.getElementById(DOM_IDS.BOARD)?.classList.remove(CSS_CLASSES.BOARD_HIDDEN);

    const scene = this.#scene;
    const wasVisible = Boolean(this.#config);
    this.#config = null;
    this.#detachBridge();
    this.#renderKey = null;
    this.#scene = null;
    if ( wasVisible ) Hooks.callAll(HOOKS.HIDDEN, this, scene);
    await this.close({ animate: false });
    if ( request === this.#request ) {
      this.#clearLoadTimer();
      this.#renderData = null;
    }
    return this;
  }

  _renderHTML(_context, _options) {
    const { config, html } = this.#renderData;
    const iframe = document.createElement("iframe");
    iframe.title = game.i18n.localize(I18N.OVERLAY_TITLE);
    iframe.referrerPolicy = "no-referrer";

    const sandbox = SANDBOX[config.trust];
    if ( sandbox ) iframe.setAttribute("sandbox", sandbox);
    if ( config.external ) iframe.src = config.src;
    if ( html !== null ) {
      iframe.removeAttribute("src");
      iframe.srcdoc = html;
    }

    this.#clearLoadTimer();
    const timer = window.setTimeout(() => {
      if ( this.#loadTimer !== timer ) return;
      this.#loadTimer = null;
      if ( !game.user.isGM ) return;
      ui.notifications.warn(game.i18n.format(I18N.LOAD_TIMEOUT, { url: config.url }), { permanent: true });
    }, LOAD_TIMEOUT_MS);
    this.#loadTimer = timer;
    iframe.addEventListener("load", () => {
      window.clearTimeout(timer);
      if ( this.#loadTimer === timer ) this.#loadTimer = null;
    }, { once: true });
    return iframe;
  }

  _replaceHTML(iframe, content) {
    content.replaceChildren(iframe);
  }

  _onRender(_context, _options) {
    this.#iframe = this.element?.querySelector("iframe") ?? null;
    this.#attachBridge();
    this.#applyElementState(this.#config);
  }

  updateSnapshot(scene) {
    if ( !this.#config?.bridge || scene?.id !== this.#scene?.id ) return;
    this.#postBridge({
      channel: BRIDGE.CHANNEL,
      type: BRIDGE.TYPES.SNAPSHOT,
      value: scene.getFlag(MODULE_ID, FLAGS.SNAPSHOT) ?? null
    });
  }

  #applyElementState(config) {
    if ( !config || !this.element ) return;
    this.element.classList.toggle(CSS_CLASSES.ABOVE_UI, config.stacking === STACKING.ABOVE);
    this.element.classList.toggle(CSS_CLASSES.PASSIVE, !config.interactive);
  }

  #applyBodyState(config) {
    document.body.classList.add(CSS_CLASSES.ACTIVE);
    document.getElementById(DOM_IDS.BOARD)?.classList.toggle(CSS_CLASSES.BOARD_HIDDEN, config.hideBoard);
  }

  #emitSceneChange(previousScene, scene, config) {
    if ( previousScene?.id === scene?.id ) return;
    if ( previousScene ) Hooks.callAll(HOOKS.HIDDEN, this, previousScene);
    Hooks.callAll(HOOKS.SHOWN, this, config, scene);
  }

  #clearLoadTimer() {
    if ( this.#loadTimer === null ) return;
    window.clearTimeout(this.#loadTimer);
    this.#loadTimer = null;
  }

  #bridgeContext(config, scene) {
    return {
      mode: game.user.isGM ? "gm" : "player",
      snapshot: scene.getFlag(MODULE_ID, FLAGS.SNAPSHOT) ?? null,
      storage: parseStoredValue(window.localStorage, config.storageKey.trim())
    };
  }

  #attachBridge() {
    window.removeEventListener("message", this.#onBridgeMessage);
    if ( !this.#config?.bridge || !this.#iframe ) return;
    window.addEventListener("message", this.#onBridgeMessage);
  }

  #detachBridge() {
    window.removeEventListener("message", this.#onBridgeMessage);
    this.#iframe = null;
  }

  #postBridge(message) {
    this.#iframe?.contentWindow?.postMessage(message, "*");
  }

  async #handleBridgeRequest(message) {
    const respond = (ok, value = null, error = null) => this.#postBridge({
      channel: BRIDGE.CHANNEL,
      type: BRIDGE.TYPES.RESPONSE,
      requestId: message.requestId,
      ok,
      value,
      error
    });

    try {
      const storageKey = this.#config.storageKey.trim();
      switch ( message.type ) {
        case BRIDGE.TYPES.STORAGE_SET:
          if ( !storageKey ) throw new Error("No local storage key is configured for this scene.");
          window.localStorage.setItem(storageKey, JSON.stringify(message.value));
          respond(true);
          break;
        case BRIDGE.TYPES.STORAGE_CLEAR:
          if ( !storageKey ) throw new Error("No local storage key is configured for this scene.");
          window.localStorage.removeItem(storageKey);
          respond(true);
          break;
        case BRIDGE.TYPES.PUBLISH:
          if ( !message.value || typeof message.value !== "object" ) {
            throw new Error("A published snapshot must be an object.");
          }
          await this.#scene.setFlag(MODULE_ID, FLAGS.SNAPSHOT, message.value);
          respond(true);
          break;
        default:
          throw new Error("Unknown Foundry bridge request.");
      }
    } catch (error) {
      console.error(`${MODULE_ID} | Bridge request failed.`, error);
      respond(false, null, error.message);
    }
  }
}
