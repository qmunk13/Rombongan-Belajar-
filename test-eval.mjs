// mock browser globals before import
globalThis.window = globalThis;
globalThis.document = {
  getElementById: (id) => ({
    appendChild: () => {},
    innerHTML: '',
    id
  }),
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => ({ setAttribute: () => {}, style: {} }),
  head: { appendChild: () => {} },
  body: { appendChild: () => {} }
};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};
globalThis.sessionStorage = { ...globalThis.localStorage };
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: "node" },
    configurable: true
  });
} catch {}
globalThis.location = { href: "/", reload: () => {} };
globalThis.CustomEvent = class { constructor(type, detail) { this.type = type; this.detail = detail; } };
globalThis.dispatchEvent = () => {};
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
// crypto already exists in Node

try {
  await import('./dist/assets/index-BCtP-Nes.js');
  console.log("ESM Bundle evaluated successfully without errors!");
} catch (e) {
  console.error("Evaluation error:", e);
}
