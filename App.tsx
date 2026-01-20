
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6 animate-m3-in">
          <span className="material-symbols-outlined text-7xl text-primary">warning</span>
          <h1 className="serif-title text-3xl text-white italic">Configuração Necessária</h1>
          <p className="text-white/40 font-light leading-relaxed">
            As variáveis de ambiente do Supabase não foram encontradas. <br />
            Por favor, verifique se <code className="bg-white/5 px-2 py-1 rounded text-primary">VITE_SUPABASE_URL</code> e <code className="bg-white/5 px-2 py-1 rounded text-primary">VITE_SUPABASE_ANON_KEY</code> estão configuradas no seu painel da Vercel.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-dark selection:bg-primary/30 overflow-x-hidden">

      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 px-6 md:px-20 py-6 md:py-8 bg-background-dark/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleHomeClick}>
            <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-full transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-white text-lg">local_bar</span>
            </div>
            <h2 className="text-white text-base md:text-lg font-bold tracking-tight">O Mixologista Digital</h2>
          </div>

          <div className="flex items-center gap-6 md:gap-12">
            <nav className="hidden md:flex items-center gap-10">
              <button
                onClick={handleHomeClick}
                className={`text-sm font-medium transition-colors tracking-widest uppercase ${view === 'home' && status === LoadingState.IDLE ? 'text-white' : 'text-white/70 hover:text-white'}`}
              >
                Receitas
              </button>
              <button
                onClick={loadFavoritesView}
                className={`text-sm font-medium transition-colors tracking-widest uppercase ${view === 'favorites' ? 'text-white' : 'text-white/70 hover:text-white'}`}
              >
                Favoritos
              </button>
            </nav>

            <div className="flex items-center gap-3">
              {/* Avatar */}
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
                  className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden hover:border-primary/40 transition-all cursor-pointer relative group"
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
                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
                  </div>
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 transition-all hover:bg-white/5"
                title="Sair"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex md:hidden items-center justify-center w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-white">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 p-6 bg-background-dark/95 backdrop-blur-xl border border-white/10 rounded-xl animate-m3-in">
            <nav className="flex flex-col gap-4">
              <button
                onClick={() => { handleHomeClick(); setMobileMenuOpen(false); }}
                className={`text-left text-sm font-medium transition-colors tracking-widest uppercase py-2 ${view === 'home' && status === LoadingState.IDLE ? 'text-white' : 'text-white/70'}`}
              >
                Receitas
              </button>
              <button
                onClick={() => { loadFavoritesView(); setMobileMenuOpen(false); }}
                className={`text-left text-sm font-medium transition-colors tracking-widest uppercase py-2 ${view === 'favorites' ? 'text-white' : 'text-white/70'}`}
              >
                Favoritos
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow relative z-10">

        {/* Home / Hero View */}
        {view === 'home' && status === LoadingState.IDLE && (
          <>
            {/* Hero Section with Background */}
            <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
              {/* Background Image with Overlays */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-background-dark/40 to-background-dark z-10"></div>
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <div
                  className="w-full h-full bg-cover bg-center scale-105"
                  style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070")' }}
                ></div>
              </div>

              {/* Hero Content */}
              <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-20">
                <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary/90">Est. 2024</span>
                </div>

                <h1 className="serif-title text-white text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-normal leading-tight mb-8">
                  O Mixologista <br /> <span className="italic">Digital</span>
                </h1>

                <p className="text-white/60 text-base md:text-xl font-light leading-relaxed max-w-xl mx-auto mb-12 tracking-wide">
                  A arte da coquetelaria em suas mãos. Uma exploração intimista da alquimia líquida com precisão digital.
                </p>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto w-full relative group">
                  <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center bg-white/5 border border-white/10 backdrop-blur-md rounded-full focus-within:border-white/30 transition-all shadow-2xl overflow-hidden">

                    {/* Search Mode Selector */}
                    <div className="flex items-center pl-6 border-r border-white/10 py-2">
                      <select
                        value={searchMode}
                        onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                        className="bg-transparent border-none text-[10px] uppercase tracking-[0.2em] text-white/50 focus:ring-0 focus:text-white cursor-pointer py-1 pl-0 pr-6 appearance-none font-medium transition-colors"
                      >
                        <option className="bg-background-dark text-white" value="name">Nome</option>
                        <option className="bg-background-dark text-white" value="ingredients">Ingredientes</option>
                      </select>
                      <span className="material-symbols-outlined text-[14px] text-white/30 -ml-4 pointer-events-none">expand_more</span>
                    </div>

                    {/* Search Input */}
                    <div className="flex flex-1 items-center">
                      <span className="material-symbols-outlined ml-4 text-white/30 group-focus-within:text-white transition-colors">search</span>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-transparent border-none py-4 md:py-5 pl-3 pr-6 text-white text-base md:text-lg font-light tracking-wide focus:ring-0 placeholder:text-white/40"
                        placeholder="Buscar por nome ou ingrediente..."
                      />
                    </div>

                    {/* Search Button */}
                    <button
                      type="submit"
                      className="mr-4 md:mr-6 py-2 px-3 md:px-4 text-white/60 hover:text-white text-xs md:text-sm font-medium tracking-[0.1em] md:tracking-[0.2em] uppercase transition-all relative after:absolute after:bottom-1 after:left-2 after:right-2 after:h-[1px] after:bg-white/30 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-center"
                    >
                      Buscar
                    </button>
                  </div>
                </form>
              </div>

              {/* Scroll Indicator */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
                <span className="text-[10px] tracking-[0.4em] uppercase text-white/40">Role</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent"></div>
              </div>
            </section>

            {/* Featured Collections Section */}
            <section className="relative z-30 bg-background-dark px-6 md:px-20 py-24">
              <div className="max-w-[1200px] mx-auto">
                <div className="flex flex-col items-center mb-20">
                  <h4 className="text-primary text-xs font-bold leading-normal tracking-[0.3em] uppercase mb-4">Coleções em Destaque</h4>
                  <div className="w-12 h-[1px] bg-white/20"></div>
                </div>

                {/* Collection Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Inesquecíveis */}
                  <div
                    onClick={() => { setQuery('Inesquecíveis'); performSearch('Negroni', 'name'); }}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div
                      className="absolute inset-0 scale-110 group-hover:scale-100 transition-transform duration-700 bg-cover bg-center"
                      style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1551751299-1b51cab2694c?q=80&w=1974")',
                      }}
                    ></div>
                    <div className="absolute bottom-8 left-8 z-20">
                      <p className="serif-title text-white text-2xl md:text-3xl font-normal leading-tight italic">Inesquecíveis</p>
                      <p className="text-white/50 text-xs tracking-widest uppercase mt-2">The Unforgettables</p>
                    </div>
                  </div>

                  {/* Contemporâneos */}
                  <div
                    onClick={() => { setQuery('Contemporâneos'); performSearch('Espresso Martini', 'name'); }}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 cursor-pointer mt-0 md:mt-12"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div
                      className="absolute inset-0 scale-110 group-hover:scale-100 transition-transform duration-700 bg-cover bg-center"
                      style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=1972")',
                      }}
                    ></div>
                    <div className="absolute bottom-8 left-8 z-20">
                      <p className="serif-title text-white text-2xl md:text-3xl font-normal leading-tight italic">Contemporâneos</p>
                      <p className="text-white/50 text-xs tracking-widest uppercase mt-2">Contemporary Classics</p>
                    </div>
                  </div>

                  {/* Nova Era */}
                  <div
                    onClick={() => { setQuery('Nova Era'); performSearch('Penicillin', 'name'); }}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div
                      className="absolute inset-0 scale-110 group-hover:scale-100 transition-transform duration-700 bg-cover bg-center"
                      style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1587223962930-cb7f31384c19?q=80&w=1974")',
                      }}
                    ></div>
                    <div className="absolute bottom-8 left-8 z-20">
                      <p className="serif-title text-white text-2xl md:text-3xl font-normal leading-tight italic">Nova Era</p>
                      <p className="text-white/50 text-xs tracking-widest uppercase mt-2">New Era Drinks</p>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="mt-40 flex flex-col lg:flex-row gap-20 items-center">
                  <div className="flex-1 flex flex-col gap-8">
                    <h1 className="serif-title text-white text-4xl md:text-5xl font-normal leading-tight">
                      A Arte do <br /><span className="italic text-primary">Drinque Perfeito</span>
                    </h1>
                    <p className="text-white/60 text-lg font-light leading-relaxed max-w-[540px]">
                      Experimente uma coleção curada de receitas de coquetéis pensadas para o conhecedor moderno. Cada medida, cada mistura e cada guarnição são documentadas com detalhes intransigentes.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                      <div className="flex flex-col gap-3 p-6 rounded-lg border border-white/5 bg-white/[0.02]">
                        <span className="material-symbols-outlined text-primary text-3xl">liquor</span>
                        <div>
                          <h2 className="text-white text-base font-bold tracking-wide uppercase mb-1">Destilados Curados</h2>
                          <p className="text-white/40 text-sm leading-relaxed">Seleções escolhidas a dedo de destilarias boutique.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-6 rounded-lg border border-white/5 bg-white/[0.02]">
                        <span className="material-symbols-outlined text-primary text-3xl">temp_preferences_custom</span>
                        <div>
                          <h2 className="text-white text-base font-bold tracking-wide uppercase mb-1">Técnica Especialista</h2>
                          <p className="text-white/40 text-sm leading-relaxed">Domine as habilidades por trás do batido e mexido perfeitos.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <div className="w-full aspect-square rounded-full border border-white/10 flex items-center justify-center p-12">
                      <div
                        className="w-full h-full rounded-full bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-1000"
                        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1974")' }}
                      ></div>
                    </div>
                    <div className="absolute -top-4 -right-4 w-24 h-24 border-t border-r border-primary/40"></div>
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b border-l border-primary/40"></div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Loading State */}
        {status === LoadingState.LOADING && (
          <div className="flex flex-col items-center justify-center min-h-screen animate-m3-in space-y-8 px-6">
            <div className="w-20 h-20 border-2 border-white/5 border-t-primary rounded-full animate-spin"></div>
            <p className="text-white/30 text-xs font-black uppercase tracking-[0.4em] animate-pulse">{searchStatus}</p>
          </div>
        )}

        {/* Single Cocktail View */}
        {status === LoadingState.SUCCESS && data && view === 'home' && (
          <div className="animate-m3-in pt-32 pb-24 px-6 md:px-20">
            <div className="max-w-[1200px] mx-auto space-y-16">
              <button
                onClick={handleHomeClick}
                className="group w-14 h-14 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>

              <CocktailCard
                data={data}
                isFavorite={isFavoriteState}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          </div>
        )}

        {/* Multiple Results View */}
        {status === LoadingState.SUCCESS && view === 'results' && searchResults.length > 0 && (
          <div className="animate-m3-in pt-32 pb-24 px-6 md:px-20">
            <div className="max-w-[1200px] mx-auto space-y-24">
              <div className="flex items-end justify-between border-b border-white/5 pb-8 md:pb-14">
                <div className="space-y-2">
                  <button
                    onClick={handleHomeClick}
                    className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4"
                  >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Voltar</span>
                  </button>
                  <h2 className="serif-title text-4xl md:text-6xl text-white font-normal tracking-tighter italic">
                    Resultados para "{query}".
                  </h2>
                  <p className="text-white/40 font-light">Encontramos {searchResults.length} drinks com essa busca.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {searchResults.map((result) => (
                  <div
                    key={result.name}
                    onClick={() => { setData(result); setView('home'); setStatus(LoadingState.SUCCESS); }}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 cursor-pointer hover:bg-white/[0.08] transition-all duration-500"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div
                      className="absolute inset-0 scale-110 group-hover:scale-100 transition-transform duration-700 bg-cover bg-center"
                      style={{
                        backgroundImage: result.imageUrl ? `url("${result.imageUrl}")` : 'linear-gradient(to bottom, rgba(50,17,212,0.3), rgba(10,9,16,0.9))',
                        backgroundColor: result.color || '#1a1a2e'
                      }}
                    >
                      {!result.imageUrl && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-8xl text-white/10">local_bar</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-8 left-8 z-20">
                      <p className="serif-title text-white text-2xl md:text-3xl font-normal leading-tight italic group-hover:translate-x-2 transition-transform duration-500">{result.name}</p>
                      <p className="text-white/50 text-xs tracking-widest uppercase mt-2">{result.ibaClassification}</p>
                    </div>
                    <div className="absolute inset-0 z-20 flex items-end p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-black uppercase tracking-widest">Abrir Receita →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === LoadingState.ERROR && (
          <div className="flex flex-col items-center justify-center min-h-screen text-center animate-m3-in space-y-10 px-6">
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-5xl text-red-500/60">error</span>
            </div>
            <h3 className="serif-title text-4xl md:text-5xl text-white/90 italic">Ops! Algo deu errado.</h3>
            <p className="text-white/30 font-light max-w-sm mx-auto text-lg leading-relaxed">{searchStatus || "Não conseguimos completar sua busca no momento."}</p>
            <button
              onClick={handleHomeClick}
              className="px-12 py-5 rounded-full border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs font-black uppercase tracking-[0.5em]"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Not Found State */}
        {status === LoadingState.NOT_FOUND && (
          <div className="flex flex-col items-center justify-center min-h-screen text-center animate-m3-in space-y-10 px-6">
            <span className="material-symbols-outlined text-8xl text-white/10">search_off</span>
            <h3 className="serif-title text-4xl md:text-5xl text-white/90 italic">Drink não encontrado.</h3>
            <p className="text-white/30 font-light max-w-sm mx-auto text-lg leading-relaxed">Não encontramos resultado clássico ou moderno para sua busca. Tente outro termo ou ingrediente.</p>
            <button
              onClick={handleHomeClick}
              className="px-12 py-5 rounded-full border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs font-black uppercase tracking-[0.5em]"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Favorites View */}
        {view === 'favorites' && (
          <div className="animate-m3-in pt-32 pb-24 px-6 md:px-20">
            <div className="max-w-[1200px] mx-auto space-y-24">
              <div className="flex items-end justify-between border-b border-white/5 pb-8 md:pb-14">
                <div className="space-y-2">
                  <h4 className="text-primary text-xs font-bold leading-normal tracking-[0.3em] uppercase">Seu Acervo</h4>
                  <h2 className="serif-title text-5xl md:text-7xl text-white font-normal tracking-tighter italic">Favoritos.</h2>
                </div>
              </div>

              {favoritesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {favoritesList.map((fav) => (
                    <div
                      key={fav.name}
                      onClick={() => { setData(fav); setStatus(LoadingState.SUCCESS); setView('home'); }}
                      className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 cursor-pointer hover:bg-white/[0.08] transition-all duration-500"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                      <div
                        className="absolute inset-0 scale-110 group-hover:scale-100 transition-transform duration-700 bg-cover bg-center"
                        style={{
                          backgroundImage: fav.imageUrl ? `url("${fav.imageUrl}")` : 'linear-gradient(to bottom, rgba(50,17,212,0.3), rgba(10,9,16,0.9))',
                          backgroundColor: fav.color || '#1a1a2e'
                        }}
                      >
                        {!fav.imageUrl && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-8xl text-white/10">local_bar</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-8 left-8 z-20">
                        <p className="serif-title text-white text-2xl md:text-3xl font-normal leading-tight italic group-hover:translate-x-2 transition-transform duration-500">{fav.name}</p>
                        <p className="text-white/50 text-xs tracking-widest uppercase mt-2">{fav.ibaClassification}</p>
                      </div>
                      <div className="absolute top-4 right-4 z-20">
                        <span className="material-symbols-outlined text-red-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-48 border border-dashed border-white/10 rounded-lg">
                  <span className="material-symbols-outlined text-6xl text-white/10 mb-6">favorite_border</span>
                  <p className="text-white/10 text-xs font-black uppercase tracking-[0.4em]">Nenhum drink favoritado no momento.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-30 bg-background-dark border-t border-white/5 px-6 md:px-20 py-12">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-6 h-6 flex items-center justify-center bg-white/20 rounded-full">
              <span className="material-symbols-outlined text-white text-xs">local_bar</span>
            </div>
            <h2 className="text-white text-sm font-bold tracking-widest uppercase">O Mixologista Digital</h2>
          </div>
          <div className="flex gap-10">
            <a className="text-[10px] tracking-[0.3em] uppercase text-white/30 hover:text-primary transition-colors" href="#">Instagram</a>
            <a className="text-[10px] tracking-[0.3em] uppercase text-white/30 hover:text-primary transition-colors" href="#">Pinterest</a>
            <a className="text-[10px] tracking-[0.3em] uppercase text-white/30 hover:text-primary transition-colors" href="#">Contato</a>
          </div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/20">
            © 2024 Digital Mixologist Studio
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
