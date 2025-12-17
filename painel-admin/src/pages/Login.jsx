import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Verificar se já está logado
  useEffect(() => {
    if (getToken()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setLoading(true);
    
    try {
      const resultado = await api.login(email, password);
      
      // Salvar token e dados do usuário
      localStorage.setItem('token', resultado.token);
      localStorage.setItem('user', JSON.stringify(resultado.user));
      
      // Redirecionar para dashboard
      navigate('/dashboard');
      
    } catch (error) {
      setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col transition-colors duration-300">
      <div className="flex flex-1 w-full h-full relative overflow-hidden">
        {/* Background Pattern/Decoration */}
        <div className="absolute top-0 right-0 -z-10 w-2/3 h-full bg-gradient-to-l from-[#e6e6db]/50 to-transparent dark:from-white/5 pointer-events-none hidden lg:block"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container mx-auto flex flex-col items-center justify-center p-4 lg:p-8 h-full min-h-screen">
          {/* Login Card */}
          <div className="w-full max-w-[480px] bg-white dark:bg-[#1a190b] rounded-[2rem] shadow-xl border border-[#e6e6db] dark:border-[#3a392a] overflow-hidden relative">
            {/* Card Header with Brand */}
            <div className="px-8 pt-10 pb-2 text-center">
              <div className="inline-flex items-center justify-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl text-black shadow-sm">
                  <span className="material-symbols-outlined text-3xl">content_cut</span>
                </div>
                <h2 className="text-[#181811] dark:text-white text-2xl font-bold tracking-tight">BarberAdmin</h2>
              </div>
              <h1 className="text-[#181811] dark:text-white tracking-tight text-[32px] font-bold leading-tight mb-2">Welcome Back</h1>
              <p className="text-[#6b6a5a] dark:text-[#a3a290] text-base font-normal leading-normal">
                Sign in to manage clients & payments.
              </p>
            </div>
            
            {/* Form Section */}
            <div className="p-8 pt-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Error State */}
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-300 text-sm">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                    <div>
                      <p className="font-medium">Authentication Failed</p>
                      <p className="mt-0.5 opacity-90">{error}</p>
                    </div>
                  </div>
                )}
                
                {/* Email Field */}
                <label className="flex flex-col gap-2 group">
                  <span className="text-[#181811] dark:text-white text-sm font-semibold ml-1">Email or Username</span>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8b5f] dark:text-[#6b6a5a] pointer-events-none flex items-center">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input flex w-full rounded-full text-[#181811] dark:text-white border border-[#e6e6db] dark:border-[#3a392a] bg-[#fcfcfb] dark:bg-[#23220f] focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 h-14 pl-12 pr-4 placeholder:text-[#a3a290] text-base font-normal leading-normal"
                      placeholder="barber@shop.com"
                      disabled={loading}
                    />
                  </div>
                </label>
                
                {/* Password Field */}
                <label className="flex flex-col gap-2 group">
                  <div className="flex justify-between items-center ml-1">
                    <span className="text-[#181811] dark:text-white text-sm font-semibold">Password</span>
                    <a className="text-sm font-medium text-[#6b6a5a] hover:text-[#181811] dark:text-[#a3a290] dark:hover:text-white transition-colors" href="#">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8b5f] dark:text-[#6b6a5a] pointer-events-none flex items-center">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input flex w-full rounded-full text-[#181811] dark:text-white border border-[#e6e6db] dark:border-[#3a392a] bg-[#fcfcfb] dark:bg-[#23220f] focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 h-14 pl-12 pr-12 placeholder:text-[#a3a290] text-base font-normal leading-normal"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c8b5f] hover:text-[#181811] dark:text-[#6b6a5a] dark:hover:text-white transition-colors flex items-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </label>
                
                {/* Actions */}
                <div className="pt-2 flex flex-col gap-4">
                  {loading ? (
                    <button
                      type="button"
                      disabled
                      className="w-full h-14 bg-[#f9f506] opacity-70 cursor-not-allowed text-[#181811] font-bold rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                      <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></span>
                      <span>Signing in...</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full h-14 bg-primary hover:bg-[#eae605] text-black font-bold text-lg rounded-full shadow-[0_4px_0_0_rgba(0,0,0,0.05)] hover:shadow-none translate-y-0 hover:translate-y-[2px] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>Log In</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              </form>
              
              {/* Divider */}
              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e6e6db] dark:border-[#3a392a]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-[#1a190b] text-[#6b6a5a]">Don't have an account?</span>
                </div>
              </div>
              
              {/* Footer Link */}
              <div className="text-center pb-2">
                <a className="inline-flex items-center justify-center w-full h-12 rounded-full border border-[#e6e6db] dark:border-[#3a392a] text-[#181811] dark:text-white font-semibold hover:bg-[#f8f8f5] dark:hover:bg-[#23220f] transition-colors" href="#">
                  Contact Support
                </a>
              </div>
            </div>
            
            {/* Decorative Bottom Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
          </div>
          
          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#8c8b5f] dark:text-[#6b6a5a]">
              © 2024 BarberAdmin System. All rights reserved.
            </p>
            <div className="flex gap-4 justify-center mt-2 text-sm text-[#8c8b5f] dark:text-[#6b6a5a]">
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <span>•</span>
              <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

