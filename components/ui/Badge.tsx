import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'neutral',
    size = 'md',
    className = ''
}) => {
    const variants = {
        success: 'bg-green-50 text-green-700 border-green-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        neutral: 'bg-slate-50 text-slate-700 border-slate-200'
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm'
    };

    return (
        <span className={`
      inline-flex items-center font-semibold rounded-full border
      ${variants[variant]} ${sizes[size]} ${className}
    `}>
            {children}
        </span>
    );
};
