export default function Header() {
  return (
    <header className="bg-[#2d2d2d] border-b border-gray-700">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-green-400">
              FotMob&apos;s Top Picks
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              This week
            </div>
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              0
            </div>
            <button className="text-gray-400 hover:text-white">
              How to play
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
