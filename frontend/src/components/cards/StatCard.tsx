import React from "react"

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => {
  return (
    <div className="bg-[#181818] p-5 rounded-xl border border-white/5 flex flex-col justify-between hover:bg-[#202020] transition-colors">
      <div className="text-gray-400 mb-4">{icon}</div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
          {title}
        </div>
      </div>
    </div>
  )
}

export default StatCard
