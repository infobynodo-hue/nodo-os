import React from 'react'

interface NodoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const NodoTextarea = React.forwardRef<HTMLTextAreaElement, NodoTextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-[#374151]">
            {label}
            {props.required && <span className="text-[#C8F135] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full bg-white border rounded-xl text-sm text-[#1A1F2E] placeholder-[#9CA3AF]
            px-3.5 py-2.5 resize-none
            transition-all duration-150 outline-none
            ${error
              ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
              : 'border-[#E5E8EF] focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/15'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F9FAFB]
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[#9CA3AF]">{hint}</p>}
      </div>
    )
  }
)

NodoTextarea.displayName = 'NodoTextarea'
