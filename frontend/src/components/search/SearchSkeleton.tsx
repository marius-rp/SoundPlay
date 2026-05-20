export const SearchSkeleton: React.FC = () => (
  <div className="flex flex-col gap-1">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
        <div className="w-8 h-4 bg-white/5 rounded" />
        <div className="w-12 h-12 bg-white/5 rounded-md" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-white/5 rounded" />
          <div className="h-3 w-1/4 bg-white/5 rounded" />
        </div>
        <div className="w-12 h-4 bg-white/5 rounded" />
      </div>
    ))}
  </div>
)
