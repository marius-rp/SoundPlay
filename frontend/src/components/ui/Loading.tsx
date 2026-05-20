interface LoadingProps {
  title?: string
}
const Loading: React.FC<LoadingProps> = ({ title = "Loading ..." }) => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#121212] text-white">
      <p className="animate-pulse text-lg">{title}</p>
    </div>
  )
}

export default Loading