import { LoginForm } from '../components/LoginForm';
import { AuthHero } from '../components/AuthHero';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-main-bg flex flex-col lg:flex-row text-text-primary">
      {/* Left Side: Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-main-bg border-r border-white/5">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-primary-accent">Sign in</h1>
            <p className="text-text-secondary mt-2">Access your workspace</p>
          </div>

          <div className="p-8 rounded-2xl bg-surface-secondary border border-white/5 shadow-premium">
            <LoginForm />

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-text-muted text-sm">
                No account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-primary-accent hover:underline font-medium hover:text-primary-accent/80 ml-1 transition-colors"
                >
                  Create one
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: AuthHero */}
      <AuthHero 
        title="The all-in-one workspace for modern teams"
        description="Chat, manage tasks, write docs, and get AI insights — all in one place."
      />
    </div>
  );
};
;
