"use client";

interface LoadingScreenProps {
  loading: boolean;
}

export default function LoadingScreen({ loading }: LoadingScreenProps) {
  if (!loading) return null;

  return (
    <div id="loadingScreen" className="fixed inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="text-center text-white relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-current to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        </div>
        
        {/* Loading Content */}
        <div className="relative z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-full flex items-center justify-center">
                <i className="fas fa-boxes text-2xl text-white"></i>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full animate-pulse opacity-50"></div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            Carregando Estoque
          </h2>
          <p className="text-xl opacity-90 mb-8">Preparando sua interface moderna...</p>
          
          {/* Modern Loading Dots */}
          <div className="flex justify-center space-x-3">
            <div className="w-4 h-4 bg-white rounded-full animate-bounce shadow-lg"></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
} 