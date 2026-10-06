import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts';
import { Icon } from '@/components/ui';
import { useLogin } from '@/hooks/useAuth';
import { isApiError } from '@/utils/apiHelpers';

const inputClass =
  'w-full h-[40px] pl-10 pr-4 bg-surface rounded-DEFAULT border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-body-md text-body-md text-on-surface transition-all placeholder:text-outline';

function getLoginErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    // Backend returns "Invalid email or password" for 401
    if (error.code === 'UNAUTHORIZED') return error.message;
    // Validation errors — extract the first detail message if available
    if (error.code === 'VALIDATION_ERROR' && error.details?.length) {
      return error.details[0].message;
    }
    return error.message;
  }
  return 'Unable to connect. Please try again.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [guestLoginClicked, setGuestLoginClicked] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
        onError: (error) => {
          setLoginError(getLoginErrorMessage(error));
        },
      },
    );
  }

  function handleGuestLogin() {
    setEmail('admin@luxestay.com');
    setPassword('admin123');
    setGuestLoginClicked(true);
  }

  return (
    <AuthLayout>
      {/* Brand header */}
      <div className="text-center mb-8">
        <h1 className="font-display-lg text-display-lg text-on-primary mb-2">Luxe Stay</h1>
        <p className="font-body-lg text-body-lg text-surface-container-high">Premium Management</p>
      </div>

      {/* Card surface */}
      <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-8 w-full">
        <div className="mb-8 text-center">
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Welcome Back</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Sign in to access the dashboard.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label
              className="block font-label-md text-label-md text-on-surface mb-2"
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                className="block font-label-md text-label-md text-on-surface"
                htmlFor="password"
              >
                Password
              </label>
              <a
                href="#"
                className="font-label-md text-label-md text-secondary hover:text-on-secondary-container transition-colors"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass.replace('pr-4', 'pr-10')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface cursor-pointer"
            />
            <label
              htmlFor="remember"
              className="ml-2 font-body-sm text-body-sm text-on-surface-variant cursor-pointer select-none"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary text-on-primary font-label-lg text-label-lg h-12 rounded-DEFAULT hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
            <Icon name="login" />
          </button>

          {loginError && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-error-container/30 border border-error-container px-4 py-3">
              <Icon name="error" className="text-error text-lg shrink-0" />
              <p className="font-body-sm text-body-sm text-error">{loginError}</p>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="font-body-lg text-body-lg text-on-surface-variant text-primary transition-colors cursor-pointer focus:outline-none"
          >
            {!guestLoginClicked && (
              <span className="text-primary font-medium hover:underline">Guest Login?</span>
            )}
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center mt-8 font-label-md text-label-md text-surface-container-high/70">
        <p>© 2024 Luxe Stay Property Management System. All rights reserved.</p>
      </div>
    </AuthLayout>
  );
}
