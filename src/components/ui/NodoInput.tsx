import React from 'react'

interface NodoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const NodoInput = React.forwardRef<HTMLInputElement, NodoInputProps>(
  ({ label, error, hint, leftIcon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-[#3730a3]">
            {label}
            {props.required && <span className="text-[#C026A8] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-white/70 backdrop-blur-sm border rounded-xl text-sm text-[#1e1b4b] placeholder-[#6d7ab5]
              transition-all duration-150 outline-none
              ${leftIcon ? 'pl-9' : 'pl-3.5'} ${rightElement ? 'pr-10' : 'pr-3.5'} py-2.5
              ${error
                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-white/60 focus:border-[#c026a8]/50 focus:ring-2 focus:ring-[#c026a8]/10'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/40
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] flex items-center">
              {rightElement}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[#9CA3AF]">{hint}</p>}
      </div>
    )
  }
)

NodoInput.displayName = 'NodoInput'
