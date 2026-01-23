import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    helperText?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-semibold text-slate-700">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full px-4 py-3 min-h-[48px] bg-white border rounded-2xl
            text-base text-slate-900 placeholder:text-slate-400
            focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none
            transition-all
            ${icon ? 'pl-12' : ''}
            ${error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200'}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
            {helperText && !error && (
                <p className="text-sm text-slate-500">{helperText}</p>
            )}
        </div>
    );
};
