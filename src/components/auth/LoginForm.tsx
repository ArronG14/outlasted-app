import React, { useState } from 'react';
import { Eye, EyeOff, Mail, UserPlus, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthSimple } from '../../hooks/useAuthSimple';
import { useNavigate } from 'react-router-dom';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

interface LoginFormProps {
  nextUrl?: string | null;
}

export function LoginForm({ nextUrl }: LoginFormProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredUsername, setPreferredUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);

  const { signIn, signUp } = useAuthSimple();

  // Handle successful authentication
  const handleAuthSuccess = () => {
    if (nextUrl) {
      navigate(nextUrl);
    } else {
      navigate('/dashboard');
    }
  };

  const validateForm = () => {
    if (isSignUp) {
      if (!firstName.trim()) {
        setError('First name is required');
        return false;
      }
      if (!lastName.trim()) {
        setError('Last name is required');
        return false;
      }
      if (preferredUsername.length < 5) {
        setError('Username must be at least 5 characters long');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
    }
    return true;
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotification(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, preferredUsername);
        if (error) {
          setError(error.message);
        } else {
          showNotification('Account created successfully! You can now sign in.', 'success');
          // Clear form and switch to sign in
          setFirstName('');
          setLastName('');
          setEmail('');
          setPreferredUsername('');
          setPassword('');
          setConfirmPassword('');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          showNotification('Welcome back! Redirecting to dashboard...', 'success');
          setTimeout(handleAuthSuccess, 1000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
    
    setLoading(false);
  };

  // Google and Apple sign-in temporarily disabled for simplified auth
  // const handleGoogleSignIn = async () => {
  //   setLoading(true);
  //   setError('');
  //   setNotification(null);
  //   
  //   const { error } = await signInWithGoogle();
  //   
  //   if (error) {
  //     setError(error.message);
  //   } else {
  //     showNotification('Signing in with Google...', 'success');
  //     // OAuth will handle redirect automatically
  //   }
  //   
  //   setLoading(false);
  // };

  // const handleAppleSignIn = async () => {
  //   setLoading(true);
  //   setError('');
  //   setNotification(null);
  //   
  //   const { error } = await signInWithApple();
  //   
  //   if (error) {
  //     setError(error.message);
  //   } else {
  //     showNotification('Signing in with Apple...', 'success');
  //     // OAuth will handle redirect automatically
  //   }
  //   
  //   setLoading(false);
  // };

  return (
    <div className="landing-card-frosted p-8 rounded-2xl w-full max-w-md animate-slide-up">
      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-slide-up ${
          notification.type === 'success' 
            ? 'bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#014D40]' 
            : 'bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#DC2626]'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} className="text-[#00E5A0]" />
          ) : (
            <X size={20} className="text-[#DC2626]" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold landing-text-primary mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="landing-text-body">
          {isSignUp ? 'Join the survival game' : 'Ready to survive another week?'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUp && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
              <Input
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
            
            <Input
              label="Preferred Username"
              type="text"
              value={preferredUsername}
              onChange={(e) => setPreferredUsername(e.target.value)}
              placeholder="At least 5 characters"
              required
              error={preferredUsername.length > 0 && preferredUsername.length < 5 ? 'Username must be at least 5 characters' : ''}
            />
          </>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium landing-text-body">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-12 border border-[#D4D4D4] rounded-lg bg-white landing-text-primary placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#00E5A0]/20 focus:border-[#00E5A0] transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 landing-text-muted hover:landing-text-body transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {isSignUp && (
          <div className="space-y-2">
            <label className="block text-sm font-medium landing-text-body">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-[#D4D4D4] rounded-lg bg-white landing-text-primary placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#00E5A0]/20 focus:border-[#00E5A0] transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 landing-text-muted hover:landing-text-body transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-[#DC2626]">Passwords do not match</p>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-[#DC2626] bg-[#DC2626]/10 p-3 rounded-lg animate-slide-up">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full landing-bg-jade text-black hover:bg-[#00E5A0]/90 animate-jade-glow"
          disabled={loading}
        >
          {isSignUp ? <UserPlus size={20} /> : <Mail size={20} />}
          {loading 
            ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
            : (isSignUp ? 'Play Now Free' : 'Sign In & Play')
          }
        </Button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-[#D4D4D4]"></div>
        <span className="px-4 text-sm landing-text-muted">OR CONTINUE WITH</span>
        <div className="flex-1 border-t border-[#D4D4D4]"></div>
      </div>

      {/* Google and Apple sign-in temporarily disabled for simplified auth */}
      {/* <div className="space-y-3">
        <Button
          variant="google"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </Button>

        <Button
          variant="apple"
          className="w-full"
          onClick={handleAppleSignIn}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple
        </Button>
      </div> */}

      <div className="mt-8 text-center">
        <p className="landing-text-muted">
          {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setNotification(null);
              // Clear form when switching
              setFirstName('');
              setLastName('');
              setEmail('');
              setPreferredUsername('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-[#00E5A0] hover:underline font-medium animate-aqua-hover"
          >
            {isSignUp ? 'Sign in' : 'Play Now Free'}
          </button>
        </p>
      </div>
    </div>
  );
}