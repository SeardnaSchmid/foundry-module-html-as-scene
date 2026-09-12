import { syncOverlay, syncOverlayForSceneUpdate } from "./lifecycle.mjs";
import { enhanceSceneConfig, registerSceneConfigTab } from "./scene-config.mjs";

Hooks.once("init", registerSceneConfigTab);
Hooks.on("renderSceneConfig", enhanceSceneConfig);
Hooks.once("ready", syncOverlay);
Hooks.on("canvasReady", syncOverlay);
Hooks.on("updateScene", syncOverlayForSceneUpdate);
