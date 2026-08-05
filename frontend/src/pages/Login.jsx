import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { loginUser, saveAuth, isAuthenticated } from '../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(username, password);
      saveAuth(data);
      navigate('/dashboard');
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Scanning Line Animation overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-32 w-full animate-[scanline_8s_linear_infinite]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-md glass-panel rounded-3xl p-10 relative z-10"
      >
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900/50 border border-cyan-500/30 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <Shield className="h-10 w-10 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          </div>
          <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-slate-100 tracking-wide">SECURE<span className="text-cyan-400">COMPLY</span></h1>
          <p className="mt-3 text-sm text-slate-400 font-mono tracking-widest uppercase">Authorized Personnel Only</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block text-xs font-semibold text-cyan-500/80 uppercase tracking-widest mb-1">
            Operator ID
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-cyan-400 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-400/50 focus:outline-none transition-all font-mono"
              placeholder="Enter ID"
            />
          </label>

          <label className="block text-xs font-semibold text-cyan-500/80 uppercase tracking-widest mb-1">
            Access Code
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-cyan-400 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-400/50 focus:outline-none transition-all font-mono tracking-widest"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3.5 text-sm font-bold text-cyan-400 transition-all hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden group mt-8"
          >
            <span className="relative z-10 tracking-widest uppercase">{loading ? 'Authenticating...' : 'Initialize Connection'}</span>
            <div className="absolute inset-0 h-full w-0 bg-cyan-500/20 transition-all duration-300 ease-out group-hover:w-full" />
          </button>
        </form>


      </motion.div>
    </div>
  );
};

export default Login;
