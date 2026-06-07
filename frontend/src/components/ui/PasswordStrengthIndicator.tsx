import React from "react"
import { PASSWORD_RULES } from "../../utils/passwordValidator"
import { Check, X } from "lucide-react"

interface Props {
  password: string
}

const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  if (!password) return null

  const passedCount = PASSWORD_RULES.filter((r) => r.test(password)).length
  const total = PASSWORD_RULES.length

  const strengthColor =
    passedCount === total
      ? "bg-[#1ed760]"
      : passedCount >= 2
        ? "bg-yellow-400"
        : "bg-red-500"

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < passedCount ? strengthColor : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password)
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                passed ? "text-[#1ed760]" : "text-gray-400"
              }`}
            >
              {passed ? (
                <Check size={12} className="shrink-0" />
              ) : (
                <X size={12} className="shrink-0" />
              )}
              {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default PasswordStrengthIndicator
