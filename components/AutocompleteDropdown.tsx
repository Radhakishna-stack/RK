import React from 'react';

interface AutocompleteDropdownProps {
    show: boolean;
    customers: any[];
    onSelect: (customer: any) => void;
    displayField: 'name' | 'bikeNumber' | 'phone';
}

export const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
    show,
    customers,
    onSelect,
    displayField
}) => {
    if (!show || customers.length === 0) return null;

    const getDisplayText = (customer: any) => {
        switch (displayField) {
            case 'name':
                return {
                    primary: customer.name,
                    secondary: `${customer.bikeNumber} • ${customer.phone}`
                };
            case 'bikeNumber':
                return {
                    primary: customer.bikeNumber,
                    secondary: `${customer.name} • ${customer.phone}`
                };
            case 'phone':
                return {
                    primary: customer.phone,
                    secondary: `${customer.name} • ${customer.bikeNumber}`
                };
        }
    };

    return (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {customers.map((customer) => {
                const { primary, secondary } = getDisplayText(customer);
                return (
                    <div
                        key={customer.id}
                        onClick={() => onSelect(customer)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                    >
                        <p className="font-semibold text-slate-900">{primary}</p>
                        <p className="text-sm text-slate-600">{secondary}</p>
                    </div>
                );
            })}
        </div>
    );
};
