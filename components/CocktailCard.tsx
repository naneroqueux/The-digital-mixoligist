
import React from 'react';
import { CocktailProfile } from '../types';

interface CocktailCardProps {
  data: CocktailProfile;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const InfoRow: React.FC<{ icon: string; label: string; value: string; }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 group-hover:scale-110 bg-primary/10">
      <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{label}</span>
      <span className="text-white/90 text-sm font-medium">{value}</span>
    </div>
  </div>
);

export const CocktailCard: React.FC<CocktailCardProps> = ({ data, isFavorite = false, onToggleFavorite }) => {
  return (
    <div className="w-full max-w-5xl mx-auto animate-m3-in relative">
      {/* Favorite Button */}
      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-30 w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl backdrop-blur-xl border border-white/10"
          style={{ backgroundColor: isFavorite ? '#dc2626' : 'rgba(255,255,255,0.05)' }}
        >
          <span
            className={`material-symbols-outlined text-2xl ${isFavorite ? 'text-white' : 'text-white/40'}`}
            style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
      )}

      {/* Main Card */}
      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
        {/* Gradient Overlay */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${data.color || '#3211d4'}, transparent 70%)` }}
        ></div>

        <div className="relative z-10 p-6 md:p-12 lg:p-16">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start lg:items-center mb-12 md:mb-16">
            <div className="flex-1 space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 md:gap-3">
                <span
                  className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em]"
                  style={{ backgroundColor: `${data.color || '#3211d4'}20`, color: data.color || '#3211d4' }}
                >
                  {data.ibaClassification}
                </span>
                {data.categories && data.categories.map((cat, idx) => (
                  <span key={idx} className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] bg-white/5 text-white/80 border border-white/10">
                    {cat}
                  </span>
                ))}
                <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] bg-white/5 text-white/60">
                  {data.abv} ABV
                </span>
                <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] bg-white/5 text-white/40">
                  {data.difficulty}
                </span>
              </div>

              {/* Title */}
              <h2 className="serif-title text-4xl md:text-6xl lg:text-7xl text-white font-normal tracking-tight leading-tight md:leading-none italic">
                {data.name}
              </h2>

              {/* Curiosity */}
              <p className="text-white/50 text-base md:text-lg font-light leading-relaxed max-w-xl">
                "{data.curiosity}"
              </p>

              {/* Tags */}
              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {data.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-[0.1em] bg-primary/10 text-primary/70">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image */}
            <div className="relative shrink-0 self-center lg:self-auto">
              <div className="absolute inset-0 blur-3xl opacity-20" style={{ backgroundColor: data.color || '#3211d4' }}></div>
              <div className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-2xl relative z-10 bg-white/5 border border-white/10 flex items-center justify-center">
                {data.imageUrl ? (
                  <img
                    src={data.imageUrl}
                    alt={data.name}
                    className="w-full h-full object-cover animate-m3-in"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                    <span className="material-symbols-outlined text-8xl text-primary/30">local_bar</span>
                  </div>
                )}
              </div>
              {/* Decorative corners */}
              <div className="absolute -top-3 -right-3 w-16 h-16 border-t border-r border-primary/30"></div>
              <div className="absolute -bottom-3 -left-3 w-16 h-16 border-b border-l border-primary/30"></div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-16">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-10 md:space-y-12">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <InfoRow icon="wine_bar" label="Taça" value={data.glassware} />
                <InfoRow icon="science" label="Método" value={data.preparationType} />
                <InfoRow icon="eco" label="Guarnição" value={data.garnish} />
                <InfoRow icon="filter_alt" label="Filtragem" value={data.strainingTechnique} />
              </div>

              {/* Ingredients */}
              <div className="space-y-6">
                <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">list</span>
                  Composição
                </h3>
                <div className="grid gap-3">
                  {data.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 md:p-5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                      <span className="text-white/80 font-light text-base md:text-lg">{ing.name}</span>
                      <span
                        className="font-medium tracking-tight px-4 py-1.5 rounded-full text-xs md:text-sm"
                        style={{ backgroundColor: `${data.color || '#3211d4'}15`, color: data.color || '#3211d4' }}
                      >
                        {ing.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-5 space-y-8 md:space-y-10">
              {/* Method */}
              <div className="p-6 md:p-8 rounded-xl bg-white/[0.03] border border-white/5 space-y-4">
                <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">menu_book</span>
                  O Preparo
                </h3>
                <p className="text-white/90 leading-relaxed font-light text-base md:text-lg">
                  {data.method}
                </p>
              </div>

              {/* Pairing */}
              <div className="p-6 md:p-8 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">restaurant</span>
                  Harmonização
                </h3>
                <p className="text-white/70 font-light leading-relaxed italic">
                  {data.pairing}
                </p>
              </div>

              {/* History */}
              <div className="space-y-4 px-2">
                <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">history_edu</span>
                  Legado
                </h3>
                <p className="text-white/50 text-sm leading-relaxed font-light">
                  {data.history}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
