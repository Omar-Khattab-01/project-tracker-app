'use client';

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { seedProjects, type TrackerProject } from '@/lib/tracker-data';
import { TrackerApp } from './tracker-app';
import '@/app/auth.css';

function errorMessage(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === 'auth/invalid-credential')
    return 'Email or password is incorrect.';
  if (code === 'auth/email-already-in-use')
    return 'This email already has an account. Sign in or reset your password.';
  if (code === 'auth/weak-password')
    return 'Use a password with at least 8 characters.';
  if (code === 'auth/too-many-requests')
    return 'Too many attempts. Please wait before trying again.';
  if (code === 'permission-denied')
    return 'Database access was denied. Please sign in again.';
  return 'The request could not be completed. Check your connection and try again.';
}

export function CloudTracker() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(
    () =>
      onAuthStateChanged(auth, (value) => {
        setUser(value);
        setReady(true);
      }),
    [],
  );
  if (!ready) return <div className="login-page">Loading…</div>;
  return user ? <Workspace key={user.uid} user={user} /> : <Login />;
}

function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  function changeMode(nextMode: 'login' | 'signup') {
    setMode(nextMode);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage('');
  }
  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    const cleanName = name.trim();
    if (mode === 'signup' && !cleanName) {
      setMessage('Enter your full name.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        await updateProfile(credential.user, { displayName: cleanName });
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function resetPassword() {
    if (!email.trim()) {
      setMessage('Enter your email address first.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage(
        'If an account exists, a password reset email will arrive shortly.',
      );
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit} key={mode}>
        <div className="login-mark">P</div>
        <h1>Project Tracker</h1>
        <p>
          Your projects, deadlines and milestones. One private workspace,
          available across devices.
        </p>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        {mode === 'signup' && (
          <label htmlFor="signup-name">
            Full name
            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label htmlFor={`${mode}-email`}>
          Email
          <input
            id={`${mode}-email`}
            name={`${mode}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label htmlFor={`${mode}-password`}>
          Password
          <input
            id={`${mode}-password`}
            name={`${mode}-password`}
            type="password"
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === 'signup' && (
            <span className="field-hint">Use at least 8 characters.</span>
          )}
        </label>
        {mode === 'signup' && (
          <label htmlFor="signup-confirm-password">
            Confirm password
            <input
              id="signup-confirm-password"
              name="signup-confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
        )}
        <button className="primary" disabled={busy}>
          {busy
            ? 'Please wait…'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </button>
        <button
          className="text-button"
          type="button"
          disabled={busy}
          onClick={() => changeMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login'
            ? 'New here? Create an account'
            : 'Already registered? Sign in'}
        </button>
        {mode === 'login' && (
          <button
            className="text-button"
            type="button"
            disabled={busy}
            onClick={() => void resetPassword()}
          >
            Forgot password?
          </button>
        )}
        {message && (
          <output className="auth-message" aria-live="polite">
            {message}
          </output>
        )}
        <small>
          Each account has its own private data. No automatic import from your
          browser.
        </small>
      </form>
    </main>
  );
}

function Workspace({ user }: { user: User }) {
  const [projects, setProjects] = useState<TrackerProject[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState(0);
  const pending = useRef(false);
  const retry = useRef<SetStateAction<TrackerProject[]> | null>(null);
  useEffect(() => {
    return onSnapshot(
      doc(db, 'workspaces', user.uid),
      (snap) => {
        setProjects(snap.exists() ? snap.data().projects : []);
        setReady(true);
      },
      (cause) => {
        setError(errorMessage(cause));
        setReady(false);
      },
    );
  }, [user.uid, connection]);
  const update: Dispatch<SetStateAction<TrackerProject[]>> = (action) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    retry.current = action;
    void runTransaction(db, async (transaction) => {
      const ref = doc(db, 'workspaces', user.uid);
      const snapshot = await transaction.get(ref);
      const current: TrackerProject[] = snapshot.exists()
        ? snapshot.data().projects
        : [];
      const next = typeof action === 'function' ? action(current) : action;
      if (new TextEncoder().encode(JSON.stringify(next)).length > 850000)
        throw new Error('Workspace size limit reached');
      transaction.set(ref, { projects: next, updatedAt: serverTimestamp() });
    })
      .then(() => {
        retry.current = null;
      })
      .catch((cause) => {
        setError(
          cause.message === 'Workspace size limit reached'
            ? 'Workspace is too large to save. Export a backup before reducing its size.'
            : errorMessage(cause),
        );
      })
      .finally(() => {
        pending.current = false;
        setBusy(false);
      });
  };
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(projects, null, 2)], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-tracker-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="cloud-bar">
        <span>{user.email}</span>
        <output>
          {busy
            ? 'Saving…'
            : error
              ? 'Action required'
              : ready
                ? 'Cloud connected'
                : 'Connecting…'}
        </output>
        {ready && !projects.length && (
          <button
            disabled={busy}
            onClick={() => update(structuredClone(seedProjects))}
          >
            Load example portfolio
          </button>
        )}
        <button disabled={!ready || busy} onClick={exportData}>
          Export backup
        </button>
        <button disabled={busy} onClick={() => void signOut(auth)}>
          Sign out
        </button>
      </div>
      {error && (
        <div className="cloud-error" role="alert">
          {error}{' '}
          <button
            disabled={busy}
            onClick={() =>
              retry.current
                ? update(retry.current)
                : setConnection((x) => x + 1)
            }
          >
            Retry
          </button>
        </div>
      )}
      {ready ? (
        <div inert={busy}>
          <TrackerApp projects={projects} setProjects={update} />
        </div>
      ) : (
        <main className="login-page">
          {error
            ? 'Unable to load workspace. Use Retry above.'
            : 'Loading your workspace…'}
        </main>
      )}
    </>
  );
}
