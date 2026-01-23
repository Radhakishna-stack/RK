import React, { useState, useEffect } from 'react';
import { FileText, Search, Send, Bike, User, Phone, Calculator } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, InventoryItem } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const EstimatePage: React.FC = () => {
  const [jobs, setJobs] = useState<Complaint[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, inventoryData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getInventory()
      ]);
      setJobs(jobsData.filter(j => j.status !== 'completed'));
      setInventory(inventoryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendEstimate = (job: Complaint) => {
    const message = `Estimate for ${job.bikeNumber}:\nService: ${job.complaint}\nEstimated Cost: ₹${job.estimatedCost || 0}\n\nThank you! - SRK Bike Service`;
    const whatsappUrl = `https://wa.me/${job.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Estimates</h1>
        <p className="text-sm text-slate-600 mt-1">Create and send job estimates</p>
      </div>

      <Input
        type="text"
        placeholder="Search by bike number or customer name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="w-5 h-5" />}
      />

      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No active jobs</h3>
              <p className="text-slate-600">Jobs needing estimates will appear here</p>
            </div>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} padding="md">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{job.bikeNumber}</h3>
                      <Badge variant="warning" size="sm">
                        {job.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{job.customerName}</span>
                      </div>
                      {job.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{job.phone}</span>
                        </div>
                      )}
                      <p className="text-slate-700 mt-2">{job.complaint}</p>
                    </div>
                  </div>
                </div>

                {job.estimatedCost && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-700">Estimated Cost:</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">₹{job.estimatedCost.toLocaleString()}</span>
                  </div>
                )}

                <Button
                  onClick={() => sendEstimate(job)}
                  className="w-full"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Estimate via WhatsApp
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EstimatePage;
