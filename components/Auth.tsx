
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
        <div className="min-h-screen flex items-center justify-center bg-[#141218] p-6">
            <div className="w-full max-w-md animate-m3-in">
                <div className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center justify-center mb-6">
                        <i className="ph ph-martini text-6xl text-[#D0BCFF]"></i>
                    </div>
                    <h1 className="font-display text-5xl text-white font-normal tracking-tight">
                        Seja bem-vindo.
                    </h1>
                    <p className="text-white/40 font-light text-lg">
                        {isSignUp ? 'Crie sua conta no acervo digital.' : 'Acesse seu bar pessoal.'}
                    </p>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-10 rounded-[48px] shadow-2xl space-y-8">
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4">E-mail</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-16 px-8 rounded-full bg-white/[0.05] border border-white/5 text-white outline-none focus:border-[#D0BCFF]/30 transition-all text-lg font-light"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-16 px-8 rounded-full bg-white/[0.05] border border-white/5 text-white outline-none focus:border-[#D0BCFF]/30 transition-all text-lg font-light"
                                placeholder="••••••••"
                            />
                        </div>

                        {message && (
                            <p className={`text-sm text-center px-4 font-medium ${message.type === 'error' ? 'text-red-400' : 'text-[#D0BCFF]'}`}>
                                {message.text}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 rounded-full bg-[#D0BCFF] text-[#381E72] font-bold text-lg hover:bg-[#e1d5ff] transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-[#381E72]/20 border-t-[#381E72] rounded-full animate-spin"></div>
                            ) : (
                                <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                            )}
                        </button>
                    </form>

                    <div className="pt-6 border-t border-white/5 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-white/40 hover:text-white transition-colors text-sm font-medium"
                        >
                            {isSignUp ? 'Já tem uma conta? Entre agora.' : 'Não tem conta? Crie uma gratuitamente.'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
