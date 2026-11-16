import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRound, revealTile, BASE_REWARD } from '../public/game-engine.mjs';
import { seal, unseal, fromBase64, toBase64 } from '../worker/vault.mjs';
import { importIdentity, createPass } from '../worker/pass.mjs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const TMP_IDENTITY_PATH = '/tmp/amplyfy-wallet-identity-v1.enc';
const REPO_IDENTITY_PATH = path.join(ROOT_DIR, 'wallet-assets', 'identity.enc');
const te = new TextEncoder();

const EMBEDDED_WALLET_ASSETS = {
  'wwdr.pem':
    'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVWVENDQXoyZ0F3SUJBZ0lVRTl4M2xWSng1VDNHTXVqTS8rVWg4OHpGenRJd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1lqRUxNQWtHQTFVRUJoTUNWVk14RXpBUkJnTlZCQW9UQ2tGd2NHeGxJRWx1WXk0eEpqQWtCZ05WQkFzVApIVUZ3Y0d4bElFTmxjblJwWm1sallYUnBiMjRnUVhWMGFHOXlhWFI1TVJZd0ZBWURWUVFERXcxQmNIQnNaU0JTCmIyOTBJRU5CTUI0WERUSXdNVEl4TmpFNU16WXdORm9YRFRNd01USXhNREF3TURBd01Gb3dkVEZFTUVJR0ExVUUKQXd3N1FYQndiR1VnVjI5eWJHUjNhV1JsSUVSbGRtVnNiM0JsY2lCU1pXeGhkR2x2Ym5NZ1EyVnlkR2xtYVdOaApkR2x2YmlCQmRYUm9iM0pwZEhreEN6QUpCZ05WQkFzTUFrYzBNUk13RVFZRFZRUUtEQXBCY0hCc1pTQkpibU11Ck1Rc3dDUVlEVlFRR0V3SlZVekNDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFEZ2dFUEFEQ0NBUW9DZ2dFQkFOQWYKZUtwNkp6S3dSbC9uRjNiWW9KME9LWTZ0UFRLbHhHczN5ZVJCa1dxM2VYRmRERFFFWUhYM3JrT1BSOFNHSGdqbwp2OVk1VWk4ZVoveHg4WUp0UEg0R1VuYWRMTHpWUStteHRMeEFPbmhSWFZHaEplRytiSkdkYXlGWkdFSFZENDF0ClFTbzVTaUhna0o5T0UwL1FqSm95dU5kcWtoNGxhcVF5emlJWmhRVmczQUpLOGxycmQza0NmY0NYVkd5U2puWUIKNWthUDVlWXErNkt3clJpdGJUT0ZPQ09MNm9xVzdaK3VaaytqREVBbmJaWFFZb2paUXlrbi9lMmt2MU11a0JWbApQTmt1WW1RekhXeHEzWTRocXFSZkZjWXc3Vi9takRhU2xMZmNPUUlBKzJTTTFBeUI4ai9WTkplSGRTYkNiNjRECll5RU1lOVFic1dMRkFweTkvYThDQXdFQUFhT0I3ekNCN0RBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1COEcKQTFVZEl3UVlNQmFBRkN2UWFVZVVkZ24rOUd1TkxrQ205MGROZndoZU1FUUdDQ3NHQVFVRkJ3RUJCRGd3TmpBMApCZ2dyQmdFRkJRY3dBWVlvYUhSMGNEb3ZMMjlqYzNBdVlYQndiR1V1WTI5dEwyOWpjM0F3TXkxaGNIQnNaWEp2CmIzUmpZVEF1QmdOVkhSOEVKekFsTUNPZ0lhQWZoaDFvZEhSd09pOHZZM0pzTG1Gd2NHeGxMbU52YlM5eWIyOTAKTG1OeWJEQWRCZ05WSFE0RUZnUVVXOW42SGVlYUdndWptWFlpVUlZK2tjaGJkNmd3RGdZRFZSMFBBUUgvQkFRRApBZ0VHTUJBR0NpcUdTSWIzWTJRR0FnRUVBZ1VBTUEwR0NTcUdTSWIzRFFFQkN3VUFBNElCQVFBL1ZqMmU1YmJECmVlWkZJR2k5djNPTExCS2VBdU91Z0NLTUJCN0RVc2h3Z0tqN3pxZXcxVUpFZ2dPQ1R3YjhPMGtVKzloMFVvV3YKcDUwaDV3RVNBNS9OUUZqUUFkZS9Nb01yVTFnb1BPNmNuMVIyUFdRbnhuNk5IVGhOTGE2QjVybWx1SnlKbFBlZgp4NGVsVVdZMEd6bHhPU1RqaDJmdnBiRm9lNHp1UGZldXRudmkwdi9mWWNacWRVbVZJa1NvQlB5VXVBc3VPUkZKCkV0SGxnZXBaQUU5YlBGbzIybm9pY3drSmFjM0FmT3JpSlA2WVJMajQ3N0p4UHhwZDFGMStNMDJjSFNTK0FQQ1EKQTFpWlFUMHhXbUpBcnptb1VVT1Nxd1Nvbk1KTnNVdlNxM3hLWCt1ZE83eFBpRUFHRS8rUUY0b0lSeW5vWXBncApwVThSQldrNnovS2YKLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=',
  'icon.png':
    'iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAXUlEQVR4nGP8P0nkPwOdARO9LRy1lOaABZeESusPnJruVHOQrZaBAYdP8RmCLk+KWryW0hqMWjpqKe0sxZa3cMmTohYGGEdMLTNaDNIUjFo6aintLB0tBkctJRUAAGyTLCjTdcgKAAAAAElFTkSuQmCC',
  'icon@2x.png':
    'iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAADhu0ooAAAAvUlEQVR4nO3YsQ3CMBBA0QuiYABGYEtqFmA+BqELFRK6IrKJnCj//qtjyz9xEXuan9c5CjjtvYCtGEpjKI2hNIbSnP8ZdHu8m5993S+7zxsRMfX8AvYsJFta2Kh5f5XZus2ha9760vhR82Z+URpDaQylMZTGUJrm0N7TQuv4UfNmZb5o1zHtC38ePbIyW9dQmjKh3gKuXUjmLeBGvAWkMZTGUBpDaQylMTTzFvAgvAWkKbN1DaUxlMZQmjKhH956Tu5O1SVWAAAAAElFTkSuQmCC',
  'icon@3x.png':
    'iVBORw0KGgoAAAANSUhEUgAAAFcAAABXCAYAAABxyNlsAAABXklEQVR4nO3bwUlDQRRAUSMuLMAS7NK1DVifhbiLKyGEZJHMOzjKPQU83lw+nw+ZHI4fL8eHEI+/vcB/VlyouFBxoeJCxYWKCxUXKi5UXKi4UHGh4kLFhZ4mh72+fy3P+Hx7/vM7/Bh7cicOtTpnhx1OjcSdWmZl3g47nFuOO32oe+busMMlS3HVoW6Zv8MO1/S1ABUXKi5UXKi4UHGh4kLFhYoLFRcqLlRcqLhQcaHiQsWFluJO/ZC3Mn+HHa5ZfnLV4W6Zu8MOl4y8FqYPd8+8HXY4N/bOnTrcypwddjh16H9oTl8LUHGh4kLFhYoLFRcqLtTlZ7DDjy4/wzldfobzuvwM53b5Gc7vawEqLlRcqLhQcaHiQsWFigsVFyouVFyouFBxoeJCxYWKC3X5Gc7v8jOc2+VnOK/Lz3BOl5+hvhag4kLFhYoLFRcqLlRcqLhQcaHiQsWFigsVF/oGz7d0nD96FXgAAAAASUVORK5CYII=',
};

// In-memory caches for warm serverless instances
const memoryRounds = new Map();
const memoryPasses = new Map();
let cachedEncryptedIdentity = null;

function readWalletAsset(filename) {
  const p = path.join(ROOT_DIR, 'wallet-assets', filename);
  if (fs.existsSync(p)) {
    return new Uint8Array(fs.readFileSync(p));
  }
  if (EMBEDDED_WALLET_ASSETS[filename]) {
    return fromBase64(EMBEDDED_WALLET_ASSETS[filename]);
  }
  throw new Error('Missing wallet asset: ' + filename);
}

function getIntermediatePem() {
  return new TextDecoder().decode(readWalletAsset('wwdr.pem'));
}

async function getVaultKey(envKey) {
  const raw = (envKey || process.env.WALLET_VAULT_KEY || '').trim();
  if (raw) {
    try {
      const decoded = fromBase64(raw);
      if (decoded.byteLength === 32) return raw;
    } catch {}
  }
  const digest = await crypto.subtle.digest(
    'SHA-256',
    te.encode(raw || 'amplyfy-default-vercel-vault-key-2026')
  );
  return toBase64(new Uint8Array(digest));
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function safeState(r) {
  return {
    id: r.id,
    gems: r.gems,
    amount: r.amount,
    ended: r.ended,
    cleared: r.cleared,
    claimed: r.claimed || false,
    revealed: r.revealed.map((i) => ({ index: i, mine: r.mines.includes(i) })),
  };
}

async function readCurrentRound(cookieHeader, vaultKey) {
  const cookies = parseCookies(cookieHeader);
  const token = cookies['amplyfy_round'];
  if (!token) return null;
  try {
    const r = await unseal(token, vaultKey);
    if (!r || !r.id) return null;
    const mem = memoryRounds.get(r.id);
    if (mem && (mem.revealed.length > r.revealed.length || (mem.claimed && !r.claimed))) {
      return mem;
    }
    memoryRounds.set(r.id, r);
    return r;
  } catch {
    return null;
  }
}

async function serializeRoundCookie(r, vaultKey, isSecure) {
  memoryRounds.set(r.id, r);
  const encrypted = await seal(r, vaultKey);
  const attrs = [
    `amplyfy_round=${encodeURIComponent(encrypted)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=31536000',
  ];
  if (isSecure) attrs.push('Secure');
  return attrs.join('; ');
}

async function loadIdentity(vaultKey) {
  const envIdentity = (process.env.WALLET_IDENTITY || '').trim();
  if (envIdentity) {
    try {
      return await unseal(envIdentity, vaultKey);
    } catch {
      try {
        return JSON.parse(Buffer.from(envIdentity, 'base64').toString('utf8'));
      } catch {}
    }
  }
  if (process.env.APPLE_P12_BASE64 && process.env.APPLE_P12_PASSWORD) {
    try {
      const p12Bytes = new Uint8Array(Buffer.from(process.env.APPLE_P12_BASE64.trim(), 'base64'));
      return importIdentity(p12Bytes, process.env.APPLE_P12_PASSWORD, getIntermediatePem());
    } catch {}
  }
  if (cachedEncryptedIdentity) {
    try {
      return await unseal(cachedEncryptedIdentity, vaultKey);
    } catch {}
  }
  for (const filePath of [TMP_IDENTITY_PATH, REPO_IDENTITY_PATH]) {
    try {
      if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, 'utf8').trim();
        if (text) {
          cachedEncryptedIdentity = text;
          return await unseal(text, vaultKey);
        }
      }
    } catch {}
  }
  return null;
}

async function saveIdentity(id, vaultKey) {
  const sealed = await seal(id, vaultKey);
  cachedEncryptedIdentity = sealed;
  try {
    fs.writeFileSync(TMP_IDENTITY_PATH, sealed, 'utf8');
  } catch {}
  return sealed;
}

function buildSignedPass(id, round, origin) {
  return createPass({
    identity: id,
    intermediatePem: getIntermediatePem(),
    round,
    origin,
    images: {
      'icon.png': readWalletAsset('icon.png'),
      'icon@2x.png': readWalletAsset('icon@2x.png'),
      'icon@3x.png': readWalletAsset('icon@3x.png'),
      'logo.png': readWalletAsset('logo.png'),
      'logo@2x.png': readWalletAsset('logo@2x.png'),
      'logo@3x.png': readWalletAsset('logo@3x.png'),
      'strip.png': readWalletAsset('strip.png'),
      'strip@2x.png': readWalletAsset('strip@2x.png'),
    },
  });
}

function renderAdminHtml(requireEmail) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AMPLYFY | Private Wallet Setup</title><style>*{box-sizing:border-box}body{margin:0;background:#fffaf6;font:16px/1.6 system-ui,sans-serif;color:#19130e}main{width:min(100% - 40px,580px);margin:65px auto}h1{font-size:38px;line-height:1.1;letter-spacing:-1.6px}small{font-size:11px;letter-spacing:2px;color:#b66214}p{color:#897563}form{background:white;padding:30px;border:1px solid #ecdccd;border-radius:22px;display:grid;gap:20px}label{display:grid;gap:8px;font-size:13px;font-weight:600}input,textarea{min-width:0;width:100%;padding:13px;border:1px solid #ded3c9;border-radius:8px;font:inherit}button{font:700 15px system-ui;background:#ff8d16;border:0;border-radius:9px;padding:16px;cursor:pointer;color:#1c1208}button:disabled{opacity:.5;cursor:wait}#status{font-size:13px;background:#fff1df;border-radius:12px;padding:14px;margin:20px 0}#result{font-size:13px;color:#715234}#env-box{display:none;background:#f7efe6;border:1px solid #e2d1c0;border-radius:12px;padding:16px;margin-top:16px}a{color:#a24b00}.note{font-size:12px}strong{color:#372619}</style></head><body><main><small>AMPLYFY · OWNER ACCESS ONLY</small><h1>Connect Apple Wallet.</h1><p>Upload your signing identity directly to your site.</p><div id="status" role="status">Checking Wallet configuration…</div><form id="setup">${requireEmail ? '<label>Owner email (WALLET_OWNER_EMAIL)<input name="email" type="email" autocomplete="email" placeholder="you@amplyfy.com" required></label>' : ''}<label>AMPLYFY signing file (.p12)<input name="identity" type="file" accept=".p12,.pfx" required></label><label>Export password<input name="password" type="password" autocomplete="off" required></label><button type="submit">Connect Apple Wallet</button><div id="result" role="status" aria-live="polite"></div><div id="env-box"><label>Save this encrypted string as <code>WALLET_IDENTITY</code> in Vercel Environment Variables for permanent serverless persistence:<textarea id="env-val" rows="3" readonly></textarea></label></div></form><p class="note">Your file and password go directly to this site over HTTPS. The password is used to unlock the file, then discarded. The signing identity is encrypted before storage. Neither the file nor its private key is returned in plaintext.</p><p class="note">Pass Type: <strong>pass.com.amplyfyconsulting.rewards</strong><br>Apple Team: <strong>4Z7XC628PV</strong></p><p><a href="/">Back to the experience ↗</a></p><p><a href="/api/admin/wallet/test.pkpass">Download a $50 test pass</a></p></main><script>const form=document.querySelector('#setup'),status=document.querySelector('#status'),result=document.querySelector('#result'),envBox=document.querySelector('#env-box'),envVal=document.querySelector('#env-val');async function refresh(){const r=await fetch('/api/admin/wallet');const d=await r.json();status.textContent=d.ready?'Connected. Certificate valid until '+new Date(d.expires).toLocaleDateString()+'. You can now save rewards to Apple Wallet.':'Ready for your .p12 signing file.';}refresh().catch(()=>status.textContent='Unable to read Wallet status. Refresh this page.');form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;result.textContent='Verifying your Apple signing identity…';try{const r=await fetch('/api/admin/wallet',{method:'POST',body:new FormData(form)});const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to save certificate.');form.reset();result.textContent='Apple Wallet is connected! Open the game in Safari on your iPhone, claim a reward, then tap Add to Apple Wallet.';if(d.walletIdentity){envBox.style.display='block';envVal.value=d.walletIdentity;}await refresh();}catch(e){result.textContent=e.message;}finally{button.disabled=false;}};</script></body></html>`;
}

async function handleWebRequest(req) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get('__path') || url.pathname;
  const isSecure = url.protocol === 'https:';
  const vaultKey = await getVaultKey();
  const ownerEmail = (process.env.WALLET_OWNER_EMAIL || '').trim().toLowerCase();

  const json = (data, status = 200, extraHeaders = {}) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        ...extraHeaders,
      },
    });

  try {
    // Admin Setup Page
    if (pathname === '/admin/wallet' && req.method === 'GET') {
      return new Response(renderAdminHtml(Boolean(ownerEmail)), {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
      });
    }

    if (pathname === '/api/admin/wallet' && req.method === 'GET') {
      const id = await loadIdentity(vaultKey);
      return json({ ready: Boolean(id), expires: id?.expires || null });
    }

    if (pathname === '/api/admin/wallet' && req.method === 'POST') {
      const form = await req.formData();
      if (ownerEmail) {
        const headerEmail = (req.headers.get('oai-authenticated-user-email') || '').trim().toLowerCase();
        const formEmail = String(form.get('email') || '').trim().toLowerCase();
        if (headerEmail !== ownerEmail && formEmail !== ownerEmail) {
          return json({ error: 'Owner email does not match WALLET_OWNER_EMAIL.' }, 403);
        }
      }
      const file = form.get('identity');
      const password = form.get('password');
      if (!file || typeof file === 'string' || file.size > 65536 || typeof password !== 'string' || password.length > 1024) {
        return json({ error: 'Choose your .p12 file and enter its export password.' }, 400);
      }
      let id;
      try {
        id = importIdentity(new Uint8Array(await file.arrayBuffer()), password, getIntermediatePem());
      } catch (err) {
        return json({ error: err.message }, 400);
      }
      const sealed = await saveIdentity(id, vaultKey);
      return json({ ready: true, expires: id.expires, walletIdentity: sealed });
    }

    if (pathname === '/api/admin/wallet/test.pkpass' && req.method === 'GET') {
      const id = await loadIdentity(vaultKey);
      if (!id) return json({ error: 'Connect your signing file first at /admin/wallet.' }, 503);
      const passBytes = buildSignedPass(id, { id: 'OWNER-TEST', amount: 50 }, url.origin);
      return new Response(passBytes, {
        status: 200,
        headers: {
          'content-type': 'application/vnd.apple.pkpass',
          'content-disposition': 'attachment; filename="AMPLYFY-TEST.pkpass"',
          'cache-control': 'private, no-store',
          'x-content-type-options': 'nosniff',
        },
      });
    }

    // Public Wallet Status
    if (pathname === '/api/wallet/status' && req.method === 'GET') {
      const id = await loadIdentity(vaultKey);
      return json({ ready: Boolean(id) });
    }

    // Game API: Get current round
    if (pathname === '/api/game/round' && req.method === 'GET') {
      const r = await readCurrentRound(req.headers.get('cookie'), vaultKey);
      return r ? json(safeState(r)) : json({ error: 'Start a new round.' }, 404);
    }

    // Game API: Start or resume round
    if (pathname === '/api/game/round' && req.method === 'POST') {
      let options = {};
      try {
        options = await req.json();
      } catch {}
      const existing = await readCurrentRound(req.headers.get('cookie'), vaultKey);
      if (existing && (!options?.newRound || !existing.ended)) {
        const setCookie = await serializeRoundCookie(existing, vaultKey, isSecure);
        return json(safeState(existing), 200, { 'set-cookie': setCookie });
      }
      if (existing && Date.now() - Date.parse(existing.created) < 20 * 60 * 1000) {
        const setCookie = await serializeRoundCookie(existing, vaultKey, isSecure);
        return json(
          { ...safeState(existing), notice: 'Your reward is saved. You can play again in 20 minutes.' },
          200,
          { 'set-cookie': setCookie }
        );
      }
      const game = createRound();
      const id = crypto.randomUUID();
      const r = {
        id,
        mines: [...game.mines],
        revealed: [],
        gems: 0,
        amount: BASE_REWARD,
        ended: false,
        cleared: false,
        claimed: false,
        created: new Date().toISOString(),
      };
      const setCookie = await serializeRoundCookie(r, vaultKey, isSecure);
      return json(safeState(r), 200, { 'set-cookie': setCookie });
    }

    // Game API: Reveal tile or Claim reward
    if ((pathname === '/api/game/reveal' || pathname === '/api/game/claim') && req.method === 'POST') {
      const r = await readCurrentRound(req.headers.get('cookie'), vaultKey);
      if (!r) return json({ error: 'Start a new round first.' }, 404);

      if (pathname.endsWith('/claim')) {
        r.claimed = true;
        r.ended = true;
        const setCookie = await serializeRoundCookie(r, vaultKey, isSecure);
        return json(safeState(r), 200, { 'set-cookie': setCookie });
      }

      let body = {};
      try {
        body = await req.json();
      } catch {
        return json({ error: 'Invalid request data.' }, 400);
      }

      if (r.claimed || r.ended) {
        return json({ error: 'This round has ended.', state: safeState(r) }, 409);
      }

      const game = { ...r, mines: new Set(r.mines), revealed: new Set(r.revealed) };
      const result = revealTile(game, body.index);
      if (!result) return json({ error: 'Choose an unopened tile.' }, 400);

      const updated = {
        ...r,
        gems: game.gems,
        amount: game.amount,
        ended: game.ended,
        cleared: game.cleared,
        revealed: [...game.revealed],
      };
      const setCookie = await serializeRoundCookie(updated, vaultKey, isSecure);
      return json({ ...safeState(updated), result, index: body.index }, 200, { 'set-cookie': setCookie });
    }

    // Wallet API: Download .pkpass
    if (pathname === '/api/wallet/pass.pkpass' && req.method === 'GET') {
      const r = await readCurrentRound(req.headers.get('cookie'), vaultKey);
      if (!r?.claimed) {
        return json({ error: 'Claim your game reward before adding it to Wallet.' }, 403);
      }
      const cached = memoryPasses.get(r.id);
      if (cached) {
        return new Response(cached, {
          status: 200,
          headers: {
            'content-type': 'application/vnd.apple.pkpass',
            'content-disposition': `attachment; filename="AMPLYFY-${r.id.slice(0, 8)}.pkpass"`,
            'cache-control': 'private, no-store',
            'x-content-type-options': 'nosniff',
          },
        });
      }
      const id = await loadIdentity(vaultKey);
      if (!id) {
        return json({ error: 'Apple Wallet setup is almost ready. Connect your .p12 at /admin/wallet first.' }, 503);
      }
      const passBytes = buildSignedPass(id, r, url.origin);
      memoryPasses.set(r.id, passBytes);
      return new Response(passBytes, {
        status: 200,
        headers: {
          'content-type': 'application/vnd.apple.pkpass',
          'content-disposition': `attachment; filename="AMPLYFY-${r.id.slice(0, 8)}.pkpass"`,
          'cache-control': 'private, no-store',
          'x-content-type-options': 'nosniff',
        },
      });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    console.error('API Error:', err);
    return json({ error: err?.message || 'This request could not be completed. Please try again.' }, 500);
  }
}

export default async function handler(req, res) {
  // Support both Web Standard Request and Node.js (req, res) in Vercel
  if (typeof Request !== 'undefined' && req instanceof Request) {
    return handleWebRequest(req);
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const fullUrl = `${proto}://${host}${req.url}`;

  let bodyBuffer;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    if (chunks.length > 0) {
      bodyBuffer = Buffer.concat(chunks);
    } else if (req.body !== undefined && req.body !== null) {
      if (Buffer.isBuffer(req.body)) {
        bodyBuffer = req.body;
      } else if (typeof req.body === 'string') {
        bodyBuffer = Buffer.from(req.body);
      } else if (typeof req.body === 'object') {
        bodyBuffer = Buffer.from(JSON.stringify(req.body));
      }
    }
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  const webReq = new Request(fullUrl, {
    method: req.method,
    headers,
    body: bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer : undefined,
  });

  const webRes = await handleWebRequest(webReq);
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const arrayBuf = await webRes.arrayBuffer();
  res.end(Buffer.from(arrayBuf));
}
