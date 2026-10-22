const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const swc = require('next/dist/build/swc');

async function harness(profileResult = () => Promise.resolve({ id: 'user-1' })) {
  let stored = { token: 'saved-token', user: { id: 'user-1' } };
  const state = [];
  const effects = [];
  const listeners = new Map();
  const calls = [];
  let cursor = 0;
  let profilePromise;
  let revokeResolve;
  const revoke = new Promise(resolve => { revokeResolve = resolve; });
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useContext: () => {},
    useState: initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useEffect: effect => { effects.push(effect); },
    useMemo: factory => factory(),
  };
  const mocks = {
    react,
    "@/lib/login-metadata": { captureFirstReferral: () => null },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'next/navigation': { useRouter: () => ({ replace: path => calls.push(path) }) },
    '@/lib/user-auth': {
      USER_AUTH_STORAGE_KEY: 'auth',
      getStoredUserAuth: () => stored,
      saveUserAuth: value => { stored = value; },
      clearUserAuth: () => { stored = null; },
      fetchUserProfile: () => { profilePromise = profileResult(); return profilePromise; },
      logoutUser: token => { calls.push(['revoke', token]); return revoke; },
    },
    '@/lib/analytics': Object.fromEntries(['clearAnalyticsUserId', 'clearAnalyticsUserProperty', 'setAnalyticsUserIdFromHash', 'setAnalyticsUserProperty', 'trackEvent'].map(key => [key, () => {}])),
  };
  const source = fs.readFileSync('components/user-auth-provider.jsx', 'utf8');
  const { code } = await swc.transform(source, { jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const exports = {};
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { console, window: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) } })
    (id => mocks[id] || require(id), { exports }, exports);
  function render() {
    cursor = 0;
    effects.length = 0;
    return exports.UserAuthProvider({ children: null }).props.value;
  }
  render();
  effects[0]();
  return { render, effects, listeners, calls, revokeResolve, getStored: () => stored, setStored: value => { stored = value; }, settle: async () => { await profilePromise?.catch(() => {}); await Promise.resolve(); } };
}
test('reload restores login; storage changes sync logout, cache clearing and another tab login', async () => {
  const h = await harness();
  assert.equal(h.render().token, 'saved-token');
  h.setStored(null);
  h.listeners.get('storage')({ key: null });
  assert.equal(h.render().isAuthenticated, false);
  h.setStored({ token: 'other-tab-token', user: { id: 'user-1' } });
  h.listeners.get('storage')({ key: 'auth' });
  assert.equal(h.render().token, 'other-tab-token');
});
test('logout clears the browser immediately and revokes the previous token', async () => {
  const h = await harness();
  const pending = h.render().logout();
  assert.equal(h.getStored(), null);
  assert.equal(h.render().isAuthenticated, false);
  assert.deepEqual(h.calls, ['/login', ['revoke', 'saved-token']]);
  h.revokeResolve({});
  await pending;
});
test('temporary profile errors preserve credentials; rejected credentials are cleared', async () => {
  for (const status of [500, 401]) {
    const h = await harness(() => Promise.reject(Object.assign(new Error('Profile failed'), { status })));
    h.render();
    h.effects[1]();
    await h.settle();
    assert.equal(h.render().isAuthenticated, status !== 401);
    assert.equal(h.getStored() === null, status === 401);
  }
});
