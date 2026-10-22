const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const swc = require('next/dist/build/swc');

test('form rerenders, new callbacks and loading changes preserve the actual Google button', async () => {
  let cursor = 0;
  const slots = [];
  const effects = [];
  let mounts = 0;
  let cleanupCalls = 0;
  let listeners;
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useEffect(fn, deps) {
      const i = cursor++;
      const old = slots[i];
      if (!old || deps.some((dep, index) => dep !== old.deps[index])) {
        effects.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const mocks = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    '@/lib/google-identity': {
      loadGoogleIdentity: async () => ({}),
      renderGoogleIdentityButton(_api, options) { mounts++; listeners = options; return () => { cleanupCalls++; }; },
    },
  };
  const { code } = await swc.transform(fs.readFileSync('components/google-login-button.jsx', 'utf8'), {
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  });
  const exports = {};
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { process: { env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'test-client' } } })(id => mocks[id], { exports }, exports);
  async function render(props) {
    cursor = 0;
    const tree = exports.GoogleLoginButton(props);
    tree.props.children[1].props.children.props.ref.current ||= { offsetWidth: 400 };
    while (effects.length) effects.shift()();
    await Promise.resolve();
    await Promise.resolve();
    return tree;
  }
  const received = [];
  await render({ onCredential: value => received.push(`old:${value}`) });
  await render({ onCredential: value => received.push(`current:${value}`) });
  listeners.onCredential('first');
  const busy = await render({ disabled: true, onCredential: value => received.push(`busy:${value}`) });
  listeners.onCredential('ignored');
  assert.equal(busy.props.children[1].props.inert, true);
  await render({ disabled: false, onCredential: value => received.push(`restored:${value}`) });
  listeners.onCredential('second');
  assert.equal(mounts, 1);
  assert.equal(cleanupCalls, 0);
  assert.deepEqual(received, ['current:first', 'restored:second']);
  for (const slot of slots) slot?.cleanup?.();
  assert.equal(cleanupCalls, 1);
});
