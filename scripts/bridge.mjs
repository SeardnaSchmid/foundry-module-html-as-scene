import { BRIDGE } from "./constants.mjs";

function serializeForScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

/** Inject the small page-side bridge before the embedded application's scripts. */
export function injectBridge(html, context) {
  const options = serializeForScript({
    channel: BRIDGE.CHANNEL,
    context,
    global: BRIDGE.GLOBAL,
    timeout: BRIDGE.REQUEST_TIMEOUT_MS,
    types: BRIDGE.TYPES
  });
  const bootstrap = `<script>(()=>{const o=${options};let n=0,s=o.context.snapshot;const p=new Map(),l=new Set(),c=v=>v==null?v:JSON.parse(JSON.stringify(v));function r(type,value){const requestId=String(Date.now())+"-"+String(++n);window.parent.postMessage({channel:o.channel,type,requestId,value:c(value)},"*");return new Promise((resolve,reject)=>{const timer=window.setTimeout(()=>{p.delete(requestId);reject(new Error("Foundry bridge request timed out"));},o.timeout);p.set(requestId,{resolve,reject,timer});});}window.addEventListener("message",event=>{if(event.source!==window.parent||event.data?.channel!==o.channel)return;const message=event.data;if(message.type===o.types.RESPONSE){const pending=p.get(message.requestId);if(!pending)return;window.clearTimeout(pending.timer);p.delete(message.requestId);message.ok?pending.resolve(message.value):pending.reject(new Error(message.error||"Foundry bridge request failed"));return;}if(message.type===o.types.SNAPSHOT){s=c(message.value);for(const listener of l)listener(c(s));}});const api={version:1,mode:o.context.mode,get snapshot(){return c(s);},storage:Object.freeze({load:()=>c(o.context.storage),save:value=>r(o.types.STORAGE_SET,value),clear:()=>r(o.types.STORAGE_CLEAR)}),publish:value=>r(o.types.PUBLISH,value),onSnapshot:listener=>{l.add(listener);return()=>l.delete(listener);}};Object.defineProperty(window,o.global,{configurable:false,enumerable:true,value:Object.freeze(api),writable:false});})();</script>`;

  if ( /<head(?:\s[^>]*)?>/i.test(html) ) {
    return html.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}${bootstrap}`);
  }
  return `${bootstrap}${html}`;
}

export function parseStoredValue(storage, key) {
  if ( !key ) return null;
  const value = storage.getItem(key);
  if ( value === null ) return null;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}
