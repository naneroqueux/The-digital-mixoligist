
import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { COCKTAIL_DATABASE } from './data/cocktails';
import { getCocktailImage } from './services/imageService';
import { searchCocktail } from './services/searchService';
import { saveFavorite, removeFavorite, isFavorite, getFavorites } from './services/dbService';
import { CocktailProfile, LoadingState } from './types';
import { CocktailCard } from './components/CocktailCard';
import { supabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { Session } from '@supabase/supabase-js';

type SearchMode = 'name' | 'ingredients';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('name');
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [data, setData] = useState<CocktailProfile | null>(null);
  const [searchResults, setSearchResults] = useState<CocktailProfile[]>([]);
  const [isFavoriteState, setIsFavoriteState] = useState(false);
  const [view, setView] = useState<'home' | 'favorites' | 'results'>('home');
  const [favoritesList, setFavoritesList] = useState<CocktailProfile[]>([]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [session, setSession] = useState<Session | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const categories = ['Todos', 'Clássicos', 'Autorais', 'Low ABV', 'Sem Álcool', 'Refrescantes', 'Intensos', 'Aperitivos', 'Digestivos'];


  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (data) {
        const liked = await isFavorite(data.name);
        setIsFavoriteState(liked);
      }
    };
    checkFavoriteStatus();
  }, [data]);

  const performSearch = async (searchTerm: string, modeOverride?: SearchMode) => {
    if (!searchTerm.trim()) return;

    const mode = modeOverride || searchMode;

    setView('home');
    setStatus(LoadingState.LOADING);
    setData(null);
    setSearchResults([]);
    setSearchStatus('Iniciando busca...');

    try {
      const results = await searchCocktail(searchTerm, setSearchStatus, mode);

      if (results && results.length > 0) {
        setSearchResults(results);

        if (results.length === 1) {
          // Single result - show directly
          const singleResult = results[0];
          setData(singleResult);
          setStatus(LoadingState.SUCCESS);

          if (!singleResult.imageUrl) {
            setIsImageLoading(true);
            try {
              const img = await getCocktailImage(singleResult.name, singleResult.glassware, singleResult.garnish, singleResult.color);
              if (img) {
                setData(prev => prev ? { ...prev, imageUrl: img } : null);
              }
            } finally {
              setIsImageLoading(false);
            }
          }
        } else {
          // Multiple results - show list
          setView('results');
          setStatus(LoadingState.SUCCESS);
        }
      } else {
        setStatus(LoadingState.NOT_FOUND);
      }
    } catch (error: any) {
      console.error("Search failed:", error);
      setStatus(LoadingState.ERROR);
      setSearchStatus(`Ocorreu um erro técnico: ${error.message || 'Falha na conexão'}`);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleToggleFavorite = async () => {
    if (!data) return;
    try {
      if (isFavoriteState) {
        await removeFavorite(data.name);
        setIsFavoriteState(false);
        console.log("Removed from favorites:", data.name);
      } else {
        await saveFavorite(data);
        setIsFavoriteState(true);
        console.log("Added to favorites:", data.name);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Tenta novamente após um pequeno delay
      setTimeout(async () => {
        try {
          if (isFavoriteState) {
            await removeFavorite(data.name);
            setIsFavoriteState(false);
          } else {
            await saveFavorite(data);
            setIsFavoriteState(true);
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }, 100);
    }
  };

  const handleHomeClick = () => {
    setQuery('');
    setStatus(LoadingState.IDLE);
    setData(null);
    setSearchResults([]);
    setView('home');
  };

  const loadFavoritesView = async () => {
    try {
      const list = await getFavorites();
      console.log("Loaded favorites:", list.length);
      setFavoritesList(list);
      setView('favorites');
      setStatus(LoadingState.IDLE);
      setData(null);
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavoritesList([]);
      setView('favorites');
      setStatus(LoadingState.IDLE);
      setData(null);
    }
  };

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setSession(null);
    } catch (error) {
      console.error('Erro ao sair:', error);
      setSession(null);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user || !supabase) return;

    try {
      setIsUploadingAvatar(true);

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
      }

      // Validar tamanho (máx 1MB para base64)
      if (file.size > 1 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 1MB');
        return;
      }

      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;

          // Atualizar metadados do usuário com a imagem em base64
          const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: base64String }
          });

          if (updateError) {
            console.error('Erro ao atualizar perfil:', updateError);
            alert(`Erro ao atualizar perfil: ${updateError.message}`);
            return;
          }

          // Atualizar sessão local
          const { data: { session: newSession } } = await supabase.auth.getSession();
          setSession(newSession);

          console.log('Avatar atualizado com sucesso!');
        } catch (error: any) {
          console.error('Erro ao processar avatar:', error);
          alert(`Erro ao processar imagem: ${error.message || 'Erro desconhecido'}`);
        } finally {
          setIsUploadingAvatar(false);
          // Limpar input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        alert('Erro ao ler o arquivo');
        setIsUploadingAvatar(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Erro ao processar avatar:', error);
      alert(`Erro ao processar imagem: ${error.message || 'Erro desconhecido'}`);
      setIsUploadingAvatar(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#141218] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6 animate-m3-in">
          <i className="ph ph-warning-circle text-7xl text-[#D0BCFF]"></i>
          <h1 className="text-3xl font-display text-white">Configuração Necessária</h1>
          <p className="text-white/40 font-light leading-relaxed">
            As variáveis de ambiente do Supabase não foram encontradas. <br />
            Por favor, verifique se <code className="bg-white/5 px-2 py-1 rounded text-[#D0BCFF]">VITE_SUPABASE_URL</code> e <code className="bg-white/5 px-2 py-1 rounded text-[#D0BCFF]">VITE_SUPABASE_ANON_KEY</code> estão configuradas no seu painel da Vercel.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#141218] selection:bg-[#D0BCFF]/30">

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[10%] -right-[5%] w-[60%] h-[50%] rounded-full blur-[150px] opacity-[0.05] transition-all duration-1000"
          style={{ backgroundColor: data?.color || '#381E72' }}
        ></div>
      </div>

      <header className="fixed top-0 w-full z-50 h-16 md:h-20 flex items-center px-4 md:px-8 bg-[#141218]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={handleHomeClick}>
            <i className="ph ph-martini text-2xl md:text-3xl text-[#D0BCFF] transition-all group-hover:scale-110"></i>
            <span className="font-display text-lg md:text-2xl font-light tracking-tight text-white/90">Digital Mixologist</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={loadFavoritesView}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full transition-all flex items-center justify-center ${view === 'favorites' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              title="Favoritos"
            >
              <i className={`ph${view === 'favorites' ? '-fill' : ''} ph-heart text-lg md:text-xl`}></i>
            </button>

            <button
              onClick={handleLogout}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 transition-all"
              title="Sair"
            >
              <i className="ph ph-sign-out text-lg md:text-xl"></i>
            </button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#D0BCFF]/10 border border-[#D0BCFF]/20 flex items-center justify-center overflow-hidden ml-2 hover:border-[#D0BCFF]/40 transition-all cursor-pointer relative group"
                title="Clique para alterar foto"
              >
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                {session?.user?.user_metadata?.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <i className="ph-fill ph-user text-[#D0BCFF] text-base md:text-lg"></i>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <i className="ph ph-camera text-white text-sm"></i>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-40 pb-24 px-8 relative z-10">
        <div className="max-w-6xl mx-auto w-full">

          {view === 'home' && status === LoadingState.IDLE && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-m3-in space-y-24">
              <div className="space-y-10">
                <h1 className="font-display text-5xl md:text-7xl lg:text-9xl text-white font-normal tracking-[-1px] leading-[0.9] md:leading-[0.85] mb-8">
                  Alquimia & <br className="hidden md:block" /> Tradição.
                </h1>
                <p className="text-white/40 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-light">
                  As receitas oficiais da IBA interpretadas com precisão técnica e visual. <br className="hidden md:inline" /> Explore a elite da coquetelaria mundial.
                </p>
              </div>

              <div className="w-full max-w-3xl space-y-12">
                <form onSubmit={handleSearchSubmit} className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40">
                    <i className={`ph ${searchMode === 'name' ? 'ph-magnifying-glass' : 'ph-flask'} text-2xl`}></i>
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchMode === 'name' ? "O que vamos preparar?" : "Ingrediente..."}
                    className="w-full h-16 md:h-[72px] pl-12 md:pl-16 pr-32 md:pr-44 bg-white/[0.05] text-white rounded-full border border-white/5 transition-all outline-none text-base md:text-xl font-light focus:bg-white/[0.08] focus:border-[#D0BCFF]/30 placeholder:text-white/20 shadow-lg"
                  />

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchMode(prev => prev === 'name' ? 'ingredients' : 'name')}
                      className="h-12 w-12 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center shrink-0"
                      title="Mudar modo de busca"
                    >
                      <i className={`ph ${searchMode === 'name' ? 'ph-arrows-left-right' : 'ph-magnifying-glass-plus'} text-xl`}></i>
                    </button>
                    <button
                      type="submit"
                      className="h-10 w-10 md:w-auto md:h-12 md:px-8 rounded-full bg-[#D0BCFF] text-[#381E72] transition-all font-bold tracking-wide text-xs md:text-sm hover:bg-[#e1d5ff] active:scale-95 shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="hidden md:inline">Explorar</span>
                      <i className="ph ph-arrow-right md:hidden text-lg"></i>
                    </button>
                  </div>
                </form>

                <div className="flex flex-wrap justify-center gap-2.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-5 py-2.5 rounded-full border transition-all text-xs font-semibold tracking-wide ${activeCategory === cat ? 'bg-[#D0BCFF] text-[#381E72] border-transparent shadow-sm' : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-6 pt-12 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Sugestões de Acervo</p>
                  <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
                    {COCKTAIL_DATABASE
                      .filter(c => {
                        if (activeCategory === 'Todos') return true;
                        const searchTarget = activeCategory === 'Sem Álcool' ? 'Sem Álcool' : activeCategory.replace(/s$/, '');
                        return c.categories.includes(activeCategory) ||
                          c.categories.includes(searchTarget) ||
                          c.tags.includes(activeCategory) ||
                          c.tags.includes(searchTarget);
                      })
                      .slice(0, 8)
                      .map((c) => (
                        <button
                          key={c.name}
                          onClick={() => { setQuery(c.name); performSearch(c.name, 'name'); }}
                          className="px-5 py-2 rounded-full border border-white/5 bg-white/[0.02] text-white/40 hover:text-[#D0BCFF] hover:border-[#D0BCFF]/30 hover:bg-[#D0BCFF]/5 transition-all text-sm font-medium"
                        >
                          {c.name}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {status === LoadingState.LOADING && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-m3-in space-y-8">
              <div className="w-20 h-20 border-2 border-white/5 border-t-white/60 rounded-full animate-spin"></div>
              <p className="text-white/30 text-xs font-black uppercase tracking-[0.4em] animate-pulse">{searchStatus}</p>
            </div>
          )}

          {status === LoadingState.SUCCESS && data && (
            <div className="animate-m3-in space-y-16">
              <button
                onClick={handleHomeClick}
                className="group w-14 h-14 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center"
              >
                <i className="ph ph-arrow-left text-2xl group-hover:-translate-x-1 transition-transform"></i>
              </button>

              <CocktailCard
                data={data}
                isFavorite={isFavoriteState}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          )}

          {/* New Result List View */}
          {status === LoadingState.SUCCESS && view === 'results' && searchResults.length > 0 && (
            <div className="animate-m3-in space-y-24">
              <div className="flex items-end justify-between border-b border-white/5 pb-8 md:pb-14">
                <div className="space-y-2">
                  <button
                    onClick={handleHomeClick}
                    className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4"
                  >
                    <i className="ph ph-arrow-left text-xl"></i>
                    <span className="text-sm font-bold uppercase tracking-widest">Voltar</span>
                  </button>
                  <h2 className="font-display text-4xl md:text-6xl text-white font-normal tracking-tighter">
                    Resultados para "{query}".
                  </h2>
                  <p className="text-white/40 font-light">Encontramos {searchResults.length} drinks com essa busca.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {searchResults.map((result) => (
                  <div
                    key={result.name}
                    onClick={() => { setData(result); setView('home'); setStatus(LoadingState.SUCCESS); }}
                    className="group relative rounded-[48px] overflow-hidden bg-white/[0.02] border border-white/5 p-10 cursor-pointer hover:bg-white/[0.04] transition-all duration-700 hover:-translate-y-3 shadow-xl"
                  >
                    <div className="aspect-[4/3] rounded-[32px] bg-black/40 mb-10 overflow-hidden flex items-center justify-center relative">
                      {result.imageUrl ? (
                        <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700" />
                      ) : (
                        <i className="ph ph-martini text-8xl text-[#D0BCFF]/15"></i>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                        <span className="text-white text-xs font-black uppercase tracking-widest">Abrir Receita</span>
                      </div>
                    </div>
                    <h3 className="font-display text-3xl md:text-4xl text-white mb-4 group-hover:translate-x-2 transition-transform duration-500">{result.name}</h3>
                    <p className="text-xs text-white/30 uppercase tracking-[0.4em] font-black">{result.ibaClassification}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === LoadingState.ERROR && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-m3-in space-y-10">
              <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <i className="ph ph-warning-circle text-5xl text-red-500/60"></i>
              </div>
              <h3 className="font-display text-5xl text-white/90">Ops! Algo deu errado.</h3>
              <p className="text-white/30 font-light max-w-sm mx-auto text-lg leading-relaxed">{searchStatus || "Não conseguimos completar sua busca no momento."}</p>
              <button
                onClick={handleHomeClick}
                className="px-12 py-5 rounded-full border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs font-black uppercase tracking-[0.5em]"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {status === LoadingState.NOT_FOUND && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-m3-in space-y-10">
              <h3 className="font-display text-5xl text-white/90">Drink não encontrado.</h3>
              <p className="text-white/30 font-light max-w-sm mx-auto text-lg leading-relaxed">Não encontramos resultado clássico ou moderno para sua busca. Tente outro termo ou ingrediente.</p>
              <button
                onClick={handleHomeClick}
                className="px-12 py-5 rounded-full border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs font-black uppercase tracking-[0.5em]"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {view === 'favorites' && (
            <div className="animate-m3-in space-y-24">
              <div className="flex items-end justify-between border-b border-white/5 pb-8 md:pb-14">
                <h2 className="font-display text-5xl md:text-8xl text-white font-normal tracking-tighter">Acervo Pessoal.</h2>
              </div>

              {favoritesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {favoritesList.map((fav) => (
                    <div
                      key={fav.name}
                      onClick={() => { setData(fav); setStatus(LoadingState.SUCCESS); setView('home'); }}
                      className="group relative rounded-[48px] overflow-hidden bg-white/[0.02] border border-white/5 p-10 cursor-pointer hover:bg-white/[0.04] transition-all duration-700 hover:-translate-y-3 shadow-xl"
                    >
                      <div className="aspect-[4/3] rounded-[32px] bg-black/40 mb-10 overflow-hidden flex items-center justify-center relative">
                        {fav.imageUrl ? (
                          <img src={fav.imageUrl} alt={fav.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700" />
                        ) : (
                          <i className="ph ph-martini text-8xl text-[#D0BCFF]/15"></i>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                          <span className="text-white text-xs font-black uppercase tracking-widest">Ver Receita Completa</span>
                        </div>
                      </div>
                      <h3 className="font-display text-3xl md:text-4xl text-white mb-4 group-hover:translate-x-2 transition-transform duration-500">{fav.name}</h3>
                      <p className="text-xs text-white/30 uppercase tracking-[0.4em] font-black">{fav.ibaClassification}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-48 border border-dashed border-white/10 rounded-[64px]">
                  <p className="text-white/10 text-xs font-black uppercase tracking-[0.6em]">Nenhum drink favoritado no momento.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 text-center opacity-30 hover:opacity-100 transition-opacity border-t border-white/5">
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[1.4em] text-white">The Digital Mixologist • 2026</p>
      </footer>
    </div>
  );
};

export default App;
