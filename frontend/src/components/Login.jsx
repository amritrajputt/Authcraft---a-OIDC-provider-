import { useState } from 'react';

const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : window.location.origin;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const hasOidcParams = !!(clientId && redirectUri);

  const handleAutofillDemo = () => {
    setEmail('demo@example.com');
    setPassword('password123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasOidcParams) {
      setError('Missing OIDC parameters. Please start the login flow from the client application.');
      return;
    }

    if (!email || !password || (isRegistering && !name)) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        // Step 1: Register the new user
        const regResponse = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, password }),
        });
        const regData = await regResponse.json();
        if (!regResponse.ok) {
          throw new Error(regData.message || 'Registration failed.');
        }
      }

      // Step 2: Establish session (either directly for login, or auto-login for registration)
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, client_id: clientId }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      window.location.href = `${BACKEND_URL}/api/oidc/authorize?${searchParams.toString()}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="relative w-full max-w-md">
        <div className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
              {isRegistering ? 'Create Account' : 'OIDC Sign In'}
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              {isRegistering ? 'Register to authorize your application' : (hasOidcParams ? 'Sign in to authorize your application' : 'Identity Provider Portal')}
            </p>
          </div>

          {!hasOidcParams ? (
            <div className="space-y-6 text-center">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left">
                <div className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <div>
                    <h3 className="text-amber-400 font-semibold text-sm">Direct Access Detected</h3>
                    <p className="text-neutral-400 text-xs mt-1 leading-relaxed font-sans">
                      This login page is part of an OIDC identity provider and must be initiated from a registered client application with the appropriate query parameters (e.g., <code className="text-neutral-300 font-mono">client_id</code>, <code className="text-neutral-300 font-mono">redirect_uri</code>).
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                To test the provider flow end-to-end (including login, user consent, and token issuance), please launch our built-in demo client application:
              </p>

              <div className="flex flex-col space-y-3">
                <a
                  href={`${BACKEND_URL}/demo-client`}
                  className="inline-flex w-full items-center justify-center bg-white hover:bg-neutral-200 text-black font-semibold py-3.5 px-4 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-white/50 space-x-2 cursor-pointer font-sans"
                >
                  <span>Launch Demo Client App</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </a>

                <a
                  href="/register-client"
                  className="inline-flex w-full items-center justify-center bg-transparent hover:bg-neutral-850 border border-neutral-850 text-neutral-300 font-semibold py-3.5 px-4 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-neutral-700/50 space-x-2 cursor-pointer font-sans"
                >
                  <span>Register Client Application</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <>
              {!isRegistering && (
                <div className="mb-6 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                  <p className="text-xs text-neutral-400 mb-2 font-medium">Quick Demo</p>
                  <button
                    type="button"
                    onClick={handleAutofillDemo}
                    className="inline-flex items-center justify-center bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-300 font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                  >
                    Autofill Demo Credentials
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-start space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {isRegistering && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none transition"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-xl transition hover:bg-neutral-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span>{isRegistering ? 'Registering...' : 'Signing In...'}</span>
                    </>
                  ) : (
                    <span>{isRegistering ? 'Register & Authorize' : 'Sign In'}</span>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                  }}
                  className="text-sm text-neutral-400 hover:text-white font-semibold cursor-pointer transition focus:outline-none"
                >
                  {isRegistering ? 'Already have an account? Sign In' : 'New to Custom OIDC? Create an account'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
