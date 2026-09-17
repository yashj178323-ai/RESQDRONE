/**
 * Frontend-only demonstration session. This is NOT authentication: there is no
 * server, no token verification and no secret. It exists so the SIH demo has a
 * realistic operator-access step, and so a real auth provider can be dropped in
 * behind the same interface later.
 */

export interface OperatorSession {
  operatorId: string;
  operatorName: string;
  role: string;
  initials: string;
  loginAt: number;
}

export interface Credentials {
  operatorId: string;
  password: string;
}

const STORAGE_KEY = 'resqdrone.operator.session';
const SCHEMA_VERSION = 1;

/** Published in the UI on purpose — this is a demonstration build. */
export const DEMO_CREDENTIALS: Credentials = {
  operatorId: 'DEMO-OP-01',
  password: 'ResQDrone@2026',
};

const DEMO_OPERATOR: Omit<OperatorSession, 'loginAt'> = {
  operatorId: DEMO_CREDENTIALS.operatorId,
  operatorName: 'Prathamesh',
  role: 'Flight operator',
  initials: 'PP',
};

interface StoredSession {
  version: number;
  session: OperatorSession;
}

function storage(remember: boolean): Storage | null {
  try {
    return remember ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reads whichever store holds a session, validating its shape before trusting it. */
export function readSession(): OperatorSession | null {
  for (const store of [window.localStorage, window.sessionStorage]) {
    let raw: string | null = null;
    try {
      raw = store.getItem(STORAGE_KEY);
    } catch {
      continue;
    }
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as Partial<StoredSession>;
      const session = parsed.session;
      if (
        parsed.version === SCHEMA_VERSION &&
        session &&
        typeof session.operatorId === 'string' &&
        typeof session.operatorName === 'string' &&
        typeof session.loginAt === 'number'
      ) {
        return session;
      }
      store.removeItem(STORAGE_KEY);
    } catch {
      try {
        store.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return readSession() !== null;
}

/**
 * Resolves with a session on a credential match. The short delay mirrors a real
 * round trip so the button's pending state is visible during the demo.
 */
export async function signIn(
  credentials: Credentials,
  remember: boolean,
): Promise<OperatorSession> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 500);
  });

  const idMatches =
    credentials.operatorId.trim().toUpperCase() === DEMO_CREDENTIALS.operatorId.toUpperCase();
  const passwordMatches = credentials.password === DEMO_CREDENTIALS.password;

  if (!idMatches || !passwordMatches) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const session: OperatorSession = { ...DEMO_OPERATOR, loginAt: Date.now() };
  const store = storage(remember);
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, session }));
  } catch {
    /* session simply will not survive a reload */
  }
  return session;
}

export function signOut(): void {
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      store.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
