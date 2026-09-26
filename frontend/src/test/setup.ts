import '@testing-library/jest-dom';

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (!globalThis.fetch) {
  globalThis.fetch = (() => Promise.resolve(new Response())) as unknown as typeof fetch;
}
