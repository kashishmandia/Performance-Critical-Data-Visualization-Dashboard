'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #000000 50%, #0f0f0f 75%, #000000 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 30%, rgba(0, 255, 0, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(0, 255, 0, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, rgba(0, 255, 0, 0.05) 0%, transparent 70%)`,
          pointerEvents: 'none',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      {/* Glassmorphism card */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(31, 31, 31, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(0, 255, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
          position: 'relative',
          zIndex: 1,
          border: `1px solid rgba(0, 255, 0, 0.1)`,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.hover} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: `0 4px 20px rgba(0, 255, 0, 0.3)`,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.background}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: colors.text,
            marginBottom: '0.5rem',
            letterSpacing: '-0.5px',
          }}
        >
          Sign in with email
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '15px',
            color: colors.textSecondary,
            marginBottom: '2rem',
            lineHeight: '1.5',
          }}
        >
          Access your dashboard to visualize real-time data and analytics.
        </p>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '0.875rem 1rem',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '12px',
              color: '#ff4444',
              fontSize: '14px',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  borderRadius: '14px',
                  border: `1px solid rgba(0, 255, 0, 0.2)`,
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: colors.text,
                  fontSize: '15px',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20, 0 0 20px ${colors.primary}10`;
                  e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 255, 0, 0.2)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                }}
              />
            </div>
          </div>

          {/* Password input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 3rem 0.875rem 3rem',
                  borderRadius: '14px',
                  border: `1px solid rgba(0, 255, 0, 0.2)`,
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: colors.text,
                  fontSize: '15px',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20, 0 0 20px ${colors.primary}10`;
                  e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 255, 0, 0.2)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: colors.textSecondary,
                }}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: '2rem' }}>
            <a
              href="#"
              style={{
                color: colors.primary,
                fontSize: '14px',
                textDecoration: 'none',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Forgot password?
            </a>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.hover} 100%)`,
              color: colors.background,
              border: `1px solid ${colors.primary}`,
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.7 : 1,
              marginBottom: '2rem',
              boxShadow: `0 4px 20px rgba(0, 255, 0, 0.3)`,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = `0 6px 30px rgba(0, 255, 0, 0.5)`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = `0 4px 20px rgba(0, 255, 0, 0.3)`;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Sign up link */}
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                color: colors.textSecondary,
                fontSize: '14px',
                margin: 0,
              }}
            >
              Don't have an account?{' '}
              <a
                href="/signup"
                style={{
                  color: colors.primary,
                  textDecoration: 'none',
                  fontWeight: '600',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ThemeProvider>
      <LoginForm />
    </ThemeProvider>
  );
}

