import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building, Key, Bell, Palette, Database, Globe } from 'lucide-react';
import { dbService } from '../db';
import { AppSettings } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'business' | 'api' | 'notifications' | 'appearance'>('business');

  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    phone: '',
    address: '',
    gstNumber: ''
  });

  const [apiForm, setApiForm] = useState({
    geminiApiKey: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await dbService.getAppSettings();
      setSettings(data);

      if (data?.businessDetails) {
        setBusinessForm({
          businessName: data.businessDetails.name || '',
          phone: data.businessDetails.phone || '',
          address: data.businessDetails.address || '',
          gstNumber: data.businessDetails.gstNumber || ''
        });
      }

      setApiForm({
        geminiApiKey: localStorage.getItem('gemini_api_key') || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessDetails = async () => {
    try {
      await dbService.updateAppSettings({
        businessDetails: {
          name: businessForm.businessName,
          phone: businessForm.phone,
          address: businessForm.address,
          gstNumber: businessForm.gstNumber
        }
      });
      alert('Business details saved successfully!');
    } catch (err) {
      alert('Failed to save. Please try again.');
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiForm.geminiApiKey);
    alert('API key saved successfully!');
  };

  const sections = [
    { id: 'business' as const, icon: Building, label: 'Business Info' },
    { id: 'api' as const, icon: Key, label: 'API Keys' },
    { id: 'notifications' as const, icon: Bell, label: 'Notifications' },
    { id: 'appearance' as const, icon: Palette, label: 'Appearance' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your app configuration</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
              ${activeSection === section.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
            `}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === 'business' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Business Information</h3>

              <Input
                label="Business Name"
                type="text"
                placeholder="Enter your business name"
                value={businessForm.businessName}
                onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                icon={<Building className="w-5 h-5" />}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter phone number"
                value={businessForm.phone}
                onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
              />

              <Input
                label="Address"
                type="text"
                placeholder="Enter business address"
                value={businessForm.address}
                onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
              />

              <Input
                label="GST Number (Optional)"
                type="text"
                placeholder="Enter GST number"
                value={businessForm.gstNumber}
                onChange={(e) => setBusinessForm({ ...businessForm, gstNumber: e.target.value })}
              />

              <Button onClick={saveBusinessDetails} className="w-full">
                Save Business Details
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'api' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">API Configuration</h3>
                <p className="text-sm text-slate-600">Set up API keys for AI features</p>
              </div>

              <Input
                label="Gemini API Key"
                type="password"
                placeholder="Enter your Gemini API key"
                value={apiForm.geminiApiKey}
                onChange={(e) => setApiForm({ ...apiForm, geminiApiKey: e.target.value })}
                icon={<Key className="w-5 h-5" />}
                helperText="Required for AI features like Tech Agent and Business Insights"
              />

              <Button onClick={saveApiKey} className="w-full">
                Save API Key
              </Button>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                  Get your free API key from{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Notification Settings</h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-900">Payment Reminders</p>
                    <p className="text-xs text-slate-600">Notify when payments are due</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-900">Low Stock Alerts</p>
                    <p className="text-xs text-slate-600">Alert when inventory is low</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-900">New Customer</p>
                    <p className="text-xs text-slate-600">Notify when new customer added</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'appearance' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Appearance Settings</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 bg-blue-600 text-white rounded-xl font-semibold text-sm">
                      Light
                    </button>
                    <button className="p-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200">
                      Dark (Coming Soon)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Language
                  </label>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>English</option>
                    <option>हिंदी (Coming Soon)</option>
                    <option>தமிழ் (Coming Soon)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Data Management */}
      <Card className="bg-slate-50 border-slate-200">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Data Management</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm">
              Export Data
            </Button>
            <Button variant="secondary" size="sm">
              Clear Cache
            </Button>
          </div>
        </div>
      </Card>

      {/* Version */}
      <div className="text-center pt-4">
        <p className="text-xs text-slate-500">
          Moto Gear SRK v2.0.0
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
