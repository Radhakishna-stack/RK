import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'accent' | 'glow';
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    padding = 'md',
    variant = 'default'
}) => {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const variantStyles = {
        default: 'bg-white border-slate-200',
        accent: 'bg-white border-slate-200 border-l-[4px] border-l-[#0369A1]',
        glow: 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(3,105,161,0.06)]'
    };

    const baseStyles = 'rounded-xl border shadow-sm transition-all';
    const interactiveStyles = onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]' : '';

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${interactiveStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
