import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { dbService } from '../db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const BusinessHoroscope: React.FC = () => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchHoroscope = async () => {
    setLoading(true);
    try {
      const res = await dbService.getBusinessHoroscope("SRK BIKE SERVICE");
      setInsight(res);
    } catch (err) {
      setInsight("Your business is on a steady growth path. Focus on customer satisfaction and quality service for continued success!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoroscope();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Business Insights</h1>
        <p className="text-sm text-slate-600 mt-1">AI-powered business guidance</p>
      </div>

      {/* Insight Card */}
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-white">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-center mb-3">Today's Business Wisdom</h2>
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-purple-100">Consulting the stars...</p>
              </div>
            ) : (
              <p className="text-center italic leading-relaxed">
                "{insight}"
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Tips */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Growth Focus</h3>
              <p className="text-xs text-slate-600">Customer retention drives success</p>
            </div>
          </div>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Watch Out</h3>
              <p className="text-xs text-slate-600">Monitor low stock items</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Button */}
      <div className="text-center pt-4">
        <Button
          onClick={fetchHoroscope}
          variant="secondary"
          isLoading={loading}
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Get New Insights
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-slate-500">
          Powered by Gemini AI
        </p>
      </div>
    </div>
  );
};

export default BusinessHoroscope;
