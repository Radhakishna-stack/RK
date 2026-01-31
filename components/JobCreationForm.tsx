import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Phone, User, FileText, AlertCircle } from 'lucide-react';
import { Customer, Salesman } from '../types';
import { fieldServiceManager } from '../services/fieldServiceManager';
import { dbService } from '../db';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface JobCreationFormProps {
    onClose: () => void;
    onJobCreated: () => void;
}

const JobCreationForm: React.FC<JobCreationFormProps> = ({ onClose, onJobCreated }) => {
    const [step, setStep] = useState(1);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [employees, setEmployees] = useState<Salesman[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Form data
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [bikeNumber, setBikeNumber] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
    const [location, setLocation] = useState({ lat: 0, lng: 0, address: '' });
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [customersList, employeesList] = await Promise.all([
            dbService.getCustomers(),
            dbService.getSalesmen()
        ]);
        setCustomers(customersList);
        setEmployees(employeesList);
    };

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setBikeNumber(customer.bikeNumber || '');

        // Use customer's saved location if available
        if (customer.location) {
            setLocation(customer.location);
        }

        setStep(2);
    };

    const handleGetCurrentLocation = () => {
        setUseCurrentLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({
                        lat: latitude,
                        lng: longitude,
                        address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
                    });
                    setUseCurrentLocation(false);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Failed to get current location. Please enter manually.');
                    setUseCurrentLocation(false);
                }
            );
        }
    };

    const handleCreateJob = () => {
        if (!selectedCustomer) {
            alert('Please select a customer');
            return;
        }

        if (!issueDescription.trim()) {
            alert('Please describe the issue');
            return;
        }

        if (!location.address) {
            alert('Please set a location');
            return;
        }

        const job = fieldServiceManager.createJob({
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            customerPhone: selectedCustomer.phone,
            bikeNumber: bikeNumber || selectedCustomer.bikeNumber,
            issueDescription,
            priority,
            location
        });

        // Assign to employee if selected
        if (selectedEmployee) {
            const employee = employees.find(e => e.id === selectedEmployee);
            if (employee) {
                fieldServiceManager.assignJob(job.id, employee.id, employee.name);
            }
        }

        onJobCreated();
        onClose();
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.bikeNumber && c.bikeNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const availableEmployees = employees.filter(e => {
        const location = fieldServiceManager.getEmployeeLocation(e.id);
        return !location || location.status === 'Available';
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Create Field Service Job</h2>
                        <p className="text-sm text-slate-600">Step {step} of 3</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step 1: Select Customer */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Search Customer
                            </label>
                            <div className="relative">
                                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, phone, or bike number..."
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {filteredCustomers.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No customers found</p>
                                </div>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleCustomerSelect(customer)}
                                        className="w-full p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                                                    {customer.name}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {customer.phone}
                                                    </span>
                                                    {customer.bikeNumber && (
                                                        <span className="font-semibold">{customer.bikeNumber}</span>
                                                    )}
                                                </div>
                                                {customer.address && (
                                                    <p className="text-xs text-slate-500 mt-1">{customer.address}</p>
                                                )}
                                            </div>
                                            <div className="text-blue-500 group-hover:translate-x-1 transition-transform">
                                                →
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Job Details */}
                {step === 2 && (
                    <div className="space-y-4">
                        {/* Selected Customer Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-blue-900">{selectedCustomer?.name}</h3>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Change
                                </button>
                            </div>
                            <p className="text-sm text-blue-700">{selectedCustomer?.phone}</p>
                        </div>

                        {/* Bike Number */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Bike Number
                            </label>
                            <input
                                type="text"
                                value={bikeNumber}
                                onChange={(e) => setBikeNumber(e.target.value)}
                                placeholder="TN 01 AB 1234"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>

                        {/* Issue Description */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Issue Description *
                            </label>
                            <textarea
                                value={issueDescription}
                                onChange={(e) => setIssueDescription(e.target.value)}
                                placeholder="Describe the vehicle issue..."
                                rows={4}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            />
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Priority
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['Low', 'Medium', 'High', 'Urgent'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${priority === p
                                                ? p === 'Urgent'
                                                    ? 'bg-red-600 text-white'
                                                    : p === 'High'
                                                        ? 'bg-orange-600 text-white'
                                                        : p === 'Medium'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Service Location *
                            </label>

                            {location.address ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-2">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-green-900">Location Set</p>
                                            <p className="text-sm text-green-700 mt-1">{location.address}</p>
                                            <button
                                                onClick={() => setLocation({ lat: 0, lng: 0, address: '' })}
                                                className="text-xs text-green-600 hover:underline mt-2"
                                            >
                                                Change location
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Button
                                        onClick={handleGetCurrentLocation}
                                        disabled={useCurrentLocation}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {useCurrentLocation ? 'Getting location...' : 'Use Current Location'}
                                    </Button>

                                    <div className="text-center text-sm text-slate-500">or</div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Latitude"
                                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
                                            onChange={(e) => setLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                                        />
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Longitude"
                                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
                                            onChange={(e) => setLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Address"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                                        onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex gap-2 pt-4">
                            <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                                Back
                            </Button>
                            <Button onClick={() => setStep(3)} className="flex-1">
                                Next: Assign Employee
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Assign Employee */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h3 className="font-semibold text-slate-900 mb-2">Job Summary</h3>
                            <div className="space-y-1 text-sm text-slate-700">
                                <p><strong>Customer:</strong> {selectedCustomer?.name}</p>
                                <p><strong>Bike:</strong> {bikeNumber}</p>
                                <p><strong>Issue:</strong> {issueDescription}</p>
                                <p><strong>Priority:</strong> <span className={`font-semibold ${priority === 'Urgent' ? 'text-red-600' :
                                        priority === 'High' ? 'text-orange-600' :
                                            priority === 'Medium' ? 'text-blue-600' : 'text-slate-600'
                                    }`}>{priority}</span></p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Assign to Employee (Optional)
                            </label>

                            {availableEmployees.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No employees available</p>
                                    <p className="text-xs mt-1">Job will be created as unassigned</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedEmployee('')}
                                        className={`w-full p-3 border rounded-xl text-left transition-all ${selectedEmployee === ''
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <p className="font-semibold text-slate-900">Leave Unassigned</p>
                                        <p className="text-xs text-slate-600">Assign later from dashboard</p>
                                    </button>

                                    {availableEmployees.map((employee) => {
                                        const empLocation = fieldServiceManager.getEmployeeLocation(employee.id);
                                        const distance = empLocation && location.lat && location.lng
                                            ? fieldServiceManager['calculateDistance'](
                                                location.lat, location.lng,
                                                empLocation.location.lat, empLocation.location.lng
                                            ).toFixed(1)
                                            : null;

                                        return (
                                            <button
                                                key={employee.id}
                                                onClick={() => setSelectedEmployee(employee.id)}
                                                className={`w-full p-3 border rounded-xl text-left transition-all ${selectedEmployee === employee.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{employee.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                                                                Available
                                                            </span>
                                                            {distance && (
                                                                <span className="text-xs text-slate-600">
                                                                    {distance} km away
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedEmployee === employee.id && (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Final Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-slate-200">
                            <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                                Back
                            </Button>
                            <Button onClick={handleCreateJob} className="flex-1 bg-green-600 hover:bg-green-700">
                                <FileText className="w-4 h-4 mr-2" />
                                Create Job
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default JobCreationForm;
