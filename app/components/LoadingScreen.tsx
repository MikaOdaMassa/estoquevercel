export default function LoadingScreen({ loading }: { loading: boolean }) {
  if (!loading) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
        <p className="text-xl font-semibold text-gray-800">Carregando...</p>
        <p className="text-sm text-gray-600 mt-2">Aguarde um momento</p>
      </div>
    </div>
  );
}
