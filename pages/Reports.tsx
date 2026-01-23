import React from 'react';
import { BarChart3, FileText, TrendingUp, Package, Users, DollarSign, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const ReportsPage: React.FC = () => {
  const reportCategories = [
    {
      title: 'Financial Reports',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      reports: [
        { name: 'Sales Report', description: 'Daily, weekly, monthly sales' },
        { name: 'Profit & Loss', description: 'Income vs expenses analysis' },
        { name: 'Cash Flow', description: 'Cash in/out tracking' },
        { name: 'Payment Collection', description: 'Pending and received payments' }
      ]
    },
    {
      title: 'Inventory Reports',
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
      reports: [
        { name: 'Stock Summary', description: 'Current stock levels' },
        { name: 'Low Stock Alert', description: 'Items running low' },
        { name: 'Stock Movement', description: 'In and out tracking' }
      ]
    },
    {
      title: 'Customer Reports',
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      reports: [
        { name: 'Customer List', description: 'All customers' },
        { name: 'Top Customers', description: 'By revenue and visits' },
        { name: 'Customer Statements', description: 'Transaction history' }
      ]
    },
    {
      title: 'Service Reports',
      icon: FileText,
      color: 'bg-amber-100 text-amber-600',
      reports: [
        { name: 'Job Status', description: 'Pending, active, completed' },
        { name: 'Service History', description: 'All service records' },
        { name: 'Technician Performance', description: 'Jobs per technician' }
      ]
    }
  ];

  const quickReports = [
    { label: 'Today\'s Sales', value: '₹12,500', trend: '+15%', positive: true },
    { label: 'Pending Jobs', value: '8', trend: '-2', positive: true },
    { label: 'Low Stock Items', value: '5', trend: '+1', positive: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-sm text-slate-600 mt-1">Business insights and reports</p>
      </div>

      {/* Quick Stats */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Overview</h3>
        <div className="grid grid-cols-3 gap-3">
          {quickReports.map((item) => (
            <Card key={item.label} padding="sm">
              <div>
                <p className="text-xs text-slate-600 mb-1">{item.label}</p>
                <p className="text-xl font-bold text-slate-900">{item.value}</p>
                <p className={`text-xs font-semibold mt-1 ${item.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {item.trend}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Report Categories */}
      {reportCategories.map((category) => (
        <div key={category.title}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.color}`}>
              <category.icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{category.title}</h3>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {category.reports.map((report) => (
              <Card
                key={report.name}
                padding="md"
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{report.name}</h4>
                    <p className="text-xs text-slate-600">{report.description}</p>
                  </div>
                  <Badge variant="neutral" size="sm">
                    View
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Export Options */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Export All Reports</p>
              <p className="text-xs text-slate-600">Download comprehensive report</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
            Export
          </button>
        </div>
      </Card>

      {/* Date Range Selector */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Report Period</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Today', 'This Week', 'This Month'].map((period) => (
              <button
                key={period}
                className={`
                  p-3 rounded-xl font-semibold text-sm transition-all
                  ${period === 'Today'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                `}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
