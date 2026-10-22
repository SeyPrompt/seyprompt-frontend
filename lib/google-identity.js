const scriptUrl = "https://accounts.google.com/gsi/client";
let scriptPromise;
let initializedApi;
let initializedClientId;
let credentialHandler;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${scriptUrl}"]`);
    const created = !script;
    if (!script) {
      script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
    }
    const finish = (error) => {
      clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      if (error) {
        script.remove();
        reject(error);
      } else resolve(window.google.accounts.id);
    };
    const loaded = () => finish(window.google?.accounts?.id ? null : new Error("Google sign-in did not initialize."));
    const failed = () => finish(new Error("Unable to load Google sign-in. Check your connection or browser blockers."));
    const timeout = setTimeout(failed, 15000);
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (created) document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = undefined;
    throw error;
  });
  return scriptPromise;
}

export function renderGoogleIdentityButton(api, { container, clientId, text, onCredential, onError }) {
  const handler = (response) => {
    if (response?.credential) onCredential(response.credential);
    else onError(new Error("Google did not return a credential."));
  };
  credentialHandler = handler;
  // GIS is global: initialize once, and route responses to the mounted form.
  if (initializedApi !== api || initializedClientId !== clientId) {
    api.initialize({ client_id: clientId, callback: (response) => credentialHandler?.(response) });
    initializedApi = api;
    initializedClientId = clientId;
  }
  container.replaceChildren();
  api.renderButton(container, {
    theme: "filled_blue", size: "large", text, shape: "rectangular", logo_alignment: "left",
    width: Math.min(400, container.offsetWidth || 320),
  });
  return () => {
    if (credentialHandler === handler) credentialHandler = undefined;
    container.replaceChildren();
  };
}
