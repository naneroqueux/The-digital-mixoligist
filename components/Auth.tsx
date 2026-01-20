
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage({ text: 'Verifique seu e-mail para confirmar o cadastro!', type: 'success' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ text: error.message || 'Erro na autenticação', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-dark overflow-hidden relative">
            {/* Background with gradient overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-background-dark/95 to-primary/10 z-10"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-6 animate-m3-in">
                {/* Logo & Title */}
                <div className="mb-12 text-center space-y-6">
                    <div className="inline-flex items-center justify-center mb-4">
                        <div className="w-16 h-16 flex items-center justify-center bg-primary rounded-full">
                            <span className="material-symbols-outlined text-white text-3xl">local_bar</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="serif-title text-4xl md:text-5xl text-white font-normal">
                            {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
                        </h1>
                        <p className="text-white/40 font-light text-base md:text-lg">
                            {isSignUp ? 'Junte-se ao acervo digital de coquetelaria.' : 'Acesse seu bar pessoal.'}
                        </p>
                    </div>
                </div>

                {/* Auth Form Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-xl shadow-2xl space-y-8">
                    <form onSubmit={handleAuth} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">mail</span>
                                E-mail
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-14 px-6 rounded-lg bg-white/[0.05] border border-white/10 text-white outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all text-base font-light placeholder:text-white/30"
                                    placeholder="seu@email.com"
                                />
                                <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Senha
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 px-6 rounded-lg bg-white/[0.05] border border-white/10 text-white outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all text-base font-light placeholder:text-white/30"
                                    placeholder="••••••••"
                                />
                                <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`flex items-center gap-3 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-500/10 border border-red-500/20' : 'bg-primary/10 border border-primary/20'}`}>
                                <span className={`material-symbols-outlined text-lg ${message.type === 'error' ? 'text-red-400' : 'text-primary'}`}>
                                    {message.type === 'error' ? 'error' : 'check_circle'}
                                </span>
                                <p className={`text-sm font-medium ${message.type === 'error' ? 'text-red-400' : 'text-primary'}`}>
                                    {message.text}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-lg bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Auth Mode */}
                    <div className="pt-6 border-t border-white/5 text-center">
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                            className="text-white/40 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">{isSignUp ? 'login' : 'person_add'}</span>
                            {isSignUp ? 'Já tem uma conta? Entre agora.' : 'Não tem conta? Crie uma gratuitamente.'}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/20">
                        © 2024 O Mixologista Digital
                    </p>
                </div>
            </div>
        </div>
    );
};
