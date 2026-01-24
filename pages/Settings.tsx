import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building, Key, Bell, Palette, Database, Globe, Users, UserPlus, Edit2, Trash2, ToggleLeft, ToggleRight, Shield, Eye, EyeOff } from 'lucide-react';
import { dbService } from '../db';
import { AppSettings, User, UserRole } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getCurrentUserRole } from '../auth';

interface SettingsPageProps {
  initialSection?: string;
  onNavigate: (tab: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ initialSection = 'business', onNavigate }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'business' | 'api' | 'notifications' | 'appearance' | 'users'>(initialSection as any || 'business');
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const currentUserRole = getCurrentUserRole();

  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    phone: '',
    address: '',
    gstNumber: ''
  });

  const [apiForm, setApiForm] = useState({
    geminiApiKey: ''
  });

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    role: 'employee' as UserRole,
    isActive: true
  });

  useEffect(() => {
    loadSettings();
    if (currentUserRole === 'admin') {
      loadUsers();
    }
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await dbService.getSettings();
      setSettings(data);

      if (data) {
        setBusinessForm({
          businessName: data.transaction?.prefixes?.firmName || '',
          phone: data.general?.businessPhone || '',
          address: data.general?.businessAddress || '',
          gstNumber: ''
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

  const loadUsers = async () => {
    try {
      const userList = await dbService.getUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const saveBusinessDetails = async () => {
    try {
      if (settings) {
        const updated = {
          ...settings,
          general: {
            ...settings.general,
            businessPhone: businessForm.phone,
            businessAddress: businessForm.address
          },
          transaction: {
            ...settings.transaction,
            prefixes: {
              ...settings.transaction.prefixes,
              firmName: businessForm.businessName
            }
          }
        };
        await dbService.updateSettings(updated);
        alert('Business details saved successfully!');
      }
    } catch (err) {
      alert('Failed to save. Please try again.');
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiForm.geminiApiKey);
    alert('API key saved successfully!');
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update existing user
        const updates: any = {
          name: userForm.name,
          phone: userForm.phone,
          role: userForm.role,
          isActive: userForm.isActive
        };
        if (userForm.password) {
          updates.password = userForm.password;
        }
        await dbService.updateUser(editingUser.id, updates);
        alert('User updated successfully!');
      } else {
        // Create new user
        await dbService.addUser(userForm);
        alert('User created successfully!');
      }
      await loadUsers();
      setShowUserModal(false);
      resetUserForm();
    } catch (err: any) {
      alert(err.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await dbService.deleteUser(id);
      alert('User deleted successfully!');
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    try {
      await dbService.toggleUserStatus(id);
      await loadUsers();
    } catch (err) {
      alert('Failed to toggle user status');
    }
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        password: '', // Don't populate password for security
        name: user.name,
        phone: user.phone || '',
        role: user.role,
        isActive: user.isActive
      });
    } else {
      resetUserForm();
    }
    setShowUserModal(true);
  };

  const resetUserForm = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      name: '',
      phone: '',
      role: 'employee',
      isActive: true
    });
  };

  const sections = [
    { id: 'business' as const, icon: Building, label: 'Business Info' },
    { id: 'api' as const, icon: Key, label: 'API Keys' },
    ...(currentUserRole === 'admin' ? [{ id: 'users' as const, icon: Users, label: 'Users' }] : []),
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

      {activeSection === 'users' && currentUserRole === 'admin' && (
        <div className="space-y-4">
          {/* Add User Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">User Management</h3>
              <p className="text-sm text-slate-600 mt-1">Manage user accounts and permissions</p>
            </div>
            <Button onClick={() => openUserModal()} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>

          {/* Users List */}
          <div className="space-y-2">
            {users.map((user) => (
              <Card key={user.id} padding="sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.role === 'admin' ? 'bg-red-100 text-red-600' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{user.name}</h4>
                        {!user.isActive && (
                          <Badge variant="error" size="sm">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">@{user.username}</p>
                      <Badge variant={user.role === 'admin' ? 'error' : user.role === 'manager' ? 'info' : 'success'} size="sm" className="mt-1">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleUserStatus(user.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title={user.isActive ? 'Disable user' : 'Enable user'}
                    >
                      {user.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openUserModal(user)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {users.length === 0 && (
              <Card className="bg-slate-50">
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600">No users found</p>
                  <p className="text-sm text-slate-500 mt-1">Click "Add User" to create a new user</p>
                </div>
              </Card>
            )}
          </div>
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

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg text-2xl text-slate-500"
                >
                  ✕
                </button>
              </div>

              <Input
                label="Full Name"
                type="text"
                placeholder="Enter full name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                required
              />

              <Input
                label="Username"
                type="text"
                placeholder="Enter username"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                disabled={!!editingUser}
                helperText={editingUser ? 'Username cannot be changed' : ''}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingUser ? 'Enter new password' : 'Enter password'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Input
                label="Phone (Optional)"
                type="tel"
                placeholder="Enter phone number"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>
                <select
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {userForm.role === 'admin' && 'Full access to all features'}
                  {userForm.role === 'manager' && 'Access to most features except user management'}
                  {userForm.role === 'employee' && 'Limited access to basic features'}
                </p>
              </div>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold text-slate-700">Active User</span>
              </label>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveUser}
                  disabled={!userForm.name || !userForm.username || (!editingUser && !userForm.password)}
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

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
