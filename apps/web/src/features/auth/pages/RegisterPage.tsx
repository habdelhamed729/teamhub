import { RegisterForm } from '../components/RegisterForm';
import { AuthHero } from '../components/AuthHero';
import { useNavigate } from 'react-router-dom';

export const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-main-bg flex flex-col lg:flex-row text-text-primary">
      {/* Left Side: Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-main-bg border-r border-white/5">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-text-secondary mt-2">Join TeamHub today</p>
          </div>

          <div className="p-8 rounded-2xl bg-surface-secondary border border-white/5 shadow-premium">
            <RegisterForm />

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-text-muted text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary-accent hover:underline font-medium hover:text-primary-accent/80 ml-1 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: AuthHero */}
      <AuthHero 
        title="Start building with modern teams"
        description="Join thousands of teams collaborating in one unified hub."
      />
    </div>
  );
};
