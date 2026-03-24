import React from 'react'
import { ChevronDown } from 'lucide-react'

interface NodoSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const NodoSelect = React.forwardRef<HTMLSelectElement, NodoSelectProps>(
  ({ label, error, hint, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-[#374151]">
            {label}
            {props.required && <span className="text-[#C8F135] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full bg-white border rounded-xl text-sm text-[#1A1F2E]
              pl-3.5 pr-9 py-2.5 appearance-none cursor-pointer
              transition-all duration-150 outline-none
              ${error
                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-[#E5E8EF] focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/15'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F9FAFB]
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-[#1A1F2E]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[#9CA3AF]">{hint}</p>}
      </div>
    )
  }
)

NodoSelect.displayName = 'NodoSelect'
