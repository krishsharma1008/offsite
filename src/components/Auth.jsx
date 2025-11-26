import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your name');
        }
        await signUp(email, password, displayName.trim());
        setSuccess('Account created! You can now use the camera.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night-base text-white flex items-center justify-center px-6 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(86,122,255,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(125,162,255,0.15),_transparent_45%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="uppercase text-night-muted tracking-[0.5em] text-xs mb-3"
          >
            Shared Roll
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-semibold mb-2"
          >
            Zapcom Offsite
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-night-muted text-sm"
          >
            10 shots per person • Everyone sees all photos
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-3xl p-8"
        >
          {/* Tabs */}
          <div className="flex mb-8 bg-white/5 rounded-full p-1">
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-night-accent text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-night-accent text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-xs uppercase tracking-[0.3em] text-night-muted mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How should we call you?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-night-accent/50 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-night-muted mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-night-accent/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-night-muted mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-night-accent/50 transition-colors"
              />
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-full font-semibold text-black transition-all ${
                loading
                  ? 'bg-night-accent/50 cursor-wait'
                  : 'bg-night-accent hover:bg-night-accentSoft shadow-ring-glow'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Join Camera' : 'Create Account'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-night-muted text-xs mt-6"
        >
          By joining, you agree to share your photos with everyone at the event
        </motion.p>
      </motion.div>
    </div>
  );
}

