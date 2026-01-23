import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    padding = 'md'
}) => {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const baseStyles = 'bg-white rounded-3xl border border-slate-200 shadow-sm';
    const interactiveStyles = onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]' : '';

    return (
        <div
            className={`${baseStyles} ${paddingStyles[padding]} ${interactiveStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
