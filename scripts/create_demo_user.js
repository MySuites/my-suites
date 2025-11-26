function unquote(v) {
  if (!v || typeof v !== 'string') return v;
  // remove surrounding single or double quotes if present
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    return v.slice(1, -1);
  }
  return v;
}

const SUPABASE_URL = unquote(process.env.SUPABASE_URL);
const SERVICE_ROLE_KEY = unquote(process.env.SERVICE_ROLE_KEY);
const ANON_KEY = unquote(process.env.ANON_KEY);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('Missing required environment variables.');
  console.error('Please set SUPABASE_URL, SERVICE_ROLE_KEY and ANON_KEY.');
  process.exit(1);
}

const DEMO_EMAIL = unquote(process.env.DEMO_EMAIL) || 'demo@example.com';
const DEMO_PASSWORD = unquote(process.env.DEMO_PASSWORD) || 'DemoPass123!';
const DEMO_USERNAME = unquote(process.env.DEMO_USERNAME) || 'demo_user';
const DEMO_FULL_NAME = unquote(process.env.DEMO_FULL_NAME) || 'Demo User';

const fetch = globalThis.fetch || require('node-fetch');

async function createAdminUser() {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`;
  const body = {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: DEMO_FULL_NAME }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const json = await res.json();
    return json;
  }

  // If creation failed, try to find existing user by email.
  // First try the filtered admin users endpoint, then fall back to fetching all users and matching by email.
  const baseAdminUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`;
  try {
    const existing = await fetch(`${baseAdminUrl}?email=eq.${encodeURIComponent(DEMO_EMAIL)}`, {
      method: 'GET',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });

    if (existing.ok) {
      const list = await existing.json();
      if (Array.isArray(list) && list.length > 0) return list[0];
    }

    // Fallback: fetch all admin users and match by email (case-insensitive)
    const all = await fetch(baseAdminUrl, {
      method: 'GET',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });

    if (all.ok) {
      const list = await all.json();
      if (Array.isArray(list) && list.length > 0) {
        const found = list.find(u => u.email && u.email.toLowerCase() === (DEMO_EMAIL || '').toLowerCase());
        if (found) return found;
      }
    }
  } catch (e) {
    // ignore and throw below with original response text
  }

  const text = await res.text();
  throw new Error(`Failed to create or find user: ${res.status} ${text}`);
}

async function upsertProfile(userId) {
  const restUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles`;

  // Check if profile exists
  const check = await fetch(`${restUrl}?id=eq.${userId}`, {
    method: 'GET',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: 'application/json'
    }
  });

  if (!check.ok) {
    const t = await check.text();
    throw new Error(`Failed to check profile: ${check.status} ${t}`);
  }

  const rows = await check.json();
  if (Array.isArray(rows) && rows.length > 0) {
    console.log('Profile already exists for user id:', userId);
    return rows[0];
  }

  // Insert profile
  const payload = {
    id: userId,
    username: DEMO_USERNAME,
    full_name: DEMO_FULL_NAME,
    avatar_url: null,
    updated_at: new Date().toISOString()
  };

  const insert = await fetch(restUrl, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!insert.ok) {
    const t = await insert.text();
    throw new Error(`Failed to insert profile: ${insert.status} ${t}`);
  }

  const inserted = await insert.json();
  console.log('Inserted profile for demo user.');
  return inserted[0] || inserted;
}

async function signIn() {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('email', DEMO_EMAIL);
  params.append('password', DEMO_PASSWORD);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`
    },
    body: params.toString()
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to sign in demo user: ${res.status} ${t}`);
  }

  return await res.json();
}

async function main() {
  try {
    console.log('Creating or finding demo auth user...');
    const user = await createAdminUser();
    let userId = user?.id || user?.user?.id || user?.user_id || user?.uid || null;

    if (!userId) {
      if (user && typeof user === 'object') {
        // pick first plausible value
        userId = user.id || user.user_id || user.uid || (user.user && user.user.id) || null;
      }
    }

    if (!userId) {
      console.error('Unable to determine created user id from response:', user);
      process.exit(2);
    }

    console.log('Demo user id:', userId);

    await upsertProfile(userId);

    console.log('Signing in as demo user to produce tokens...');
    const session = await signIn();

    console.log('\n=== Demo user credentials/tokens ===');
    console.log('email:', DEMO_EMAIL);
    console.log('password:', DEMO_PASSWORD);
    console.log('user id:', userId);
    console.log('\nTokens (save these to sign into the app):');
    console.log(JSON.stringify(session, null, 2));
    console.log("\nYou can use the returned access_token as the user's auth token in the client.");

  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
