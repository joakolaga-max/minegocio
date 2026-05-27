import React, { useState } from 'react';

interface Props {
  onLogin: () => void;
}

// ── Lista blanca de emails autorizados ──
const EMAILS_AUTORIZADOS: string[] = [
  'joakolaga@gmail.com',
];

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const w = window as any;

  const handle = async (action: 'login' | 'register') => {
    if (!email.trim() || !password) { setError('Completá email y contraseña'); return; }
    // Verificar lista blanca
    const emailNorm = email.trim().toLowerCase();
    if (!EMAILS_AUTORIZADOS.map(e => e.toLowerCase()).includes(emailNorm)) {
      setError('Email no autorizado para acceder a esta aplicación');
      return;
    }
    setError(''); setLoading(true);
    try {
      if (action === 'login') await w.login(email.trim(), password);
      else await w.register(email.trim(), password);
      onLogin();
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/invalid-credential': 'Email o contraseña incorrectos',
        'auth/email-already-in-use': 'El email ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/invalid-email': 'Email inválido',
      };
      setError(msgs[e.code] || e.message || 'Error desconocido');
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!email.trim()) { setError('Ingresá tu email primero'); return; }
    setError(''); setLoading(true);
    try {
      await w.resetPassword(email.trim());
      setResetSent(true);
    } catch (e: any) {
      setError('No se pudo enviar el email de recuperación');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>🏪</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9' }}>MiNegocio</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Sistema de Precios</div>
        </div>

        {/* Card */}
        <div style={{ background: '#161b27', borderRadius: 20, border: '1px solid #1e2535', padding: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </div>

          {resetSent ? (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 16, color: '#22c55e', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
              ✅ Te enviamos un email para restablecer tu contraseña.
            </div>
          ) : (
            <>
              <input
                className="input-field"
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <input
                className="input-field"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handle(mode)}
                style={{ marginBottom: 16 }}
              />

              {error && (
                <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                  {error}
                </div>
              )}

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 12, opacity: loading ? 0.7 : 1 }}
                onClick={() => handle(mode)}
                disabled={loading}
              >
                {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
              </button>

              {mode === 'login' && (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <span
                    onClick={resetPassword}
                    style={{ fontSize: 12, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ¿Olvidaste tu contraseña?
                  </span>
                </div>
              )}
            </>
          )}

          <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
            {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
            <span
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setResetSent(false); }}
              style={{ color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}
            >
              {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
