import { CORE_SETTINGS, MODULE_ID } from "./constants.mjs";
import { HtmlAsSceneOverlay } from "./overlay.mjs";
import { sceneConfigChanged } from "./scene-config.mjs";
import { HtmlSceneConfig } from "./scene-flags.mjs";

const overlay = new HtmlAsSceneOverlay();

export async function syncOverlay() {
  const noCanvas = game.settings.get(CORE_SETTINGS.NAMESPACE, CORE_SETTINGS.NO_CANVAS);
  const scene = noCanvas ? game.scenes.active : game.scenes.current;
  const config = HtmlSceneConfig.forScene(scene);
  try {
    if ( config.active && config.visibleToMe ) await overlay.show(config, scene);
    else await overlay.hide();
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to synchronize the scene overlay.`, error);
    await overlay.hide();
  }
}

export function syncOverlayForSceneUpdate(_scene, changed) {
  if ( sceneConfigChanged(changed) ) void syncOverlay();
}
