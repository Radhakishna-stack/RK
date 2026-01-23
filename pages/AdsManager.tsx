import React, { useState } from 'react';
import { Sparkles, Megaphone, Target, Copy, Check, RefreshCw } from 'lucide-react';
import { dbService } from '../db';
import { AdSuggestion } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const AdsManagerPage: React.FC = () => {
   const [ads, setAds] = useState<AdSuggestion[]>([]);
   const [loading, setLoading] = useState(false);
   const [copiedId, setCopiedId] = useState<string | null>(null);

   const generateAds = async () => {
      setLoading(true);
      try {
         const suggestions = await dbService.generateAdSuggestions();
         setAds(suggestions);
      } catch (err) {
         // Fallback ad suggestions
         setAds([
            {
               id: '1',
               title: 'Special Service Offer',
               description: '🏍️ Get 20% OFF on Full Service this Month! Expert technicians, genuine parts, and quick turnaround. Book now!',
               platform: 'Facebook',
               targetAudience: 'Bike owners in your area'
            },
            {
               id: '2',
               title: 'Free Inspection',
               description: 'Free bike inspection this weekend! Complete check-up, safety inspection, and expert advice. Visit us today!',
               platform: 'Instagram',
               targetAudience: 'Local bike enthusiasts'
            },
            {
               id: '3',
               title: 'Genuine Parts Available',
               description: '✨ 100% Genuine Spare Parts in Stock! Best prices guaranteed. Fast service. Your bike deserves the best!',
               platform: 'WhatsApp',
               targetAudience: 'Existing customers'
            }
         ]);
      } finally {
         setLoading(false);
      }
   };

   const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
   };

   const adGoals = [
      { icon: Target, label: 'Get More Customers', color: 'bg-blue-100 text-blue-600' },
      { icon: Megaphone, label: 'Promote Offers', color: 'bg-green-100 text-green-600' },
      { icon: Sparkles, label: 'Build Awareness', color: 'bg-purple-100 text-purple-600' }
   ];

   return (
      <div className="space-y-6">
         {/* Header */}
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Ads Manager</h1>
            <p className="text-sm text-slate-600 mt-1">AI-powered ad creation</p>
         </div>

         {/* Ad Goals */}
         <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">What's Your Goal?</h3>
            <div className="grid grid-cols-3 gap-2">
               {adGoals.map((goal) => (
                  <Card key={goal.label} padding="sm">
                     <div className="flex flex-col items-center gap-2 text-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${goal.color}`}>
                           <goal.icon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-900">{goal.label}</p>
                     </div>
                  </Card>
               ))}
            </div>
         </div>

         {/* Generate Button */}
         <div className="text-center">
            <Button
               onClick={generateAds}
               isLoading={loading}
               size="lg"
            >
               <Sparkles className="w-5 h-5 mr-2" />
               Generate Ad Ideas
            </Button>
         </div>

         {/* Generated Ads */}
         {ads.length > 0 && (
            <div>
               <h3 className="text-lg font-bold text-slate-900 mb-3">Generated Ads</h3>
               <div className="space-y-3">
                  {ads.map((ad) => (
                     <Card key={ad.id} padding="md">
                        <div className="space-y-3">
                           <div className="flex items-start justify-between">
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-bold text-slate-900">{ad.title}</h4>
                                    <Badge variant="info" size="sm">
                                       {ad.platform}
                                    </Badge>
                                 </div>
                                 <p className="text-sm text-slate-700 mb-2">{ad.description}</p>
                                 <p className="text-xs text-slate-500">
                                    Target: {ad.targetAudience}
                                 </p>
                              </div>
                           </div>

                           <div className="flex gap-2 pt-2 border-t border-slate-200">
                              <Button
                                 size="sm"
                                 variant="secondary"
                                 onClick={() => copyToClipboard(ad.description, ad.id)}
                                 className="flex-1"
                              >
                                 {copiedId === ad.id ? (
                                    <>
                                       <Check className="w-4 h-4 mr-1" />
                                       Copied!
                                    </>
                                 ) : (
                                    <>
                                       <Copy className="w-4 h-4 mr-1" />
                                       Copy Text
                                    </>
                                 )}
                              </Button>
                              <Button
                                 size="sm"
                                 variant="ghost"
                                 onClick={generateAds}
                                 className="flex-1"
                              >
                                 <RefreshCw className="w-4 h-4 mr-1" />
                                 Regenerate
                              </Button>
                           </div>
                        </div>
                     </Card>
                  ))}
               </div>
            </div>
         )}

         {/* Empty State */}
         {ads.length === 0 && !loading && (
            <Card>
               <div className="text-center py-12">
                  <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Create Ads?</h3>
                  <p className="text-slate-600 mb-4">Click the button above to generate AI-powered ad ideas</p>
               </div>
            </Card>
         )}
      </div>
   );
};

export default AdsManagerPage;
