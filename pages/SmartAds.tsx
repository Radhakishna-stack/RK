import React, { useState } from 'react';
import { Sparkles, Target, Rocket, MessageCircle, Star, Zap } from 'lucide-react';
import { dbService } from '../db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface AdCampaign {
   id: string;
   title: string;
   description: string;
   platform: string;
   budget: string;
   reach: string;
}

const SmartAdsPage: React.FC = () => {
   const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
   const [campaign, setCampaign] = useState<AdCampaign | null>(null);
   const [loading, setLoading] = useState(false);

   const goals = [
      {
         id: 'awareness',
         icon: Sparkles,
         title: 'Brand Awareness',
         description: 'Get your business noticed',
         color: 'bg-purple-100 text-purple-600'
      },
      {
         id: 'traffic',
         icon: Rocket,
         title: 'More Customers',
         description: 'Drive foot traffic to shop',
         color: 'bg-blue-100 text-blue-600'
      },
      {
         id: 'engagement',
         icon: MessageCircle,
         title: 'Customer Engagement',
         description: 'Build relationships',
         color: 'bg-green-100 text-green-600'
      }
   ];

   const generateCampaign = async (goalId: string) => {
      setLoading(true);
      setSelectedGoal(goalId);

      try {
         await dbService.generateAdSuggestions();

         // Set campaign based on goal
         const campaigns: Record<string, AdCampaign> = {
            awareness: {
               id: '1',
               title: 'Grand Opening Special Campaign',
               description: 'Showcase your premium bike service with a special offer. Target local bike owners with engaging visuals and compelling copy.',
               platform: 'Facebook & Instagram',
               budget: '₹5,000 - ₹10,000',
               reach: '10,000 - 15,000 people'
            },
            traffic: {
               id: '2',
               title: 'Weekend Service Drive',
               description: 'Attract customers with a limited-time weekend offer. Get 50% off on first service! Perfect for new customer acquisition.',
               platform: 'Google Ads',
               budget: '₹3,000 - ₹7,000',
               reach: '5,000 - 8,000 people'
            },
            engagement: {
               id: '3',
               title: 'Customer Loyalty Program',
               description: 'Keep customers coming back with a points-based loyalty program. Share success stories and customer testimonials.',
               platform: 'WhatsApp & SMS',
               budget: '₹2,000 - ₹5,000',
               reach: '3,000 - 5,000 customers'
            }
         };

         setCampaign(campaigns[goalId] || campaigns.awareness);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-6">
         {/* Header */}
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Smart Ads</h1>
            <p className="text-sm text-slate-600 mt-1">AI-powered advertising campaigns</p>
         </div>

         {/* Campaign Summary */}
         <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
            <div className="flex items-center gap-3">
               <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Zap className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-sm text-purple-100 mb-1">Smart Campaign Builder</p>
                  <h2 className="text-2xl font-bold">Create in 3 Steps</h2>
               </div>
            </div>
         </Card>

         {/* Goals Selection */}
         <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Step 1: Choose Your Goal</h3>
            <div className="grid grid-cols-1 gap-3">
               {goals.map((goal) => (
                  <Card
                     key={goal.id}
                     padding="md"
                     onClick={() => generateCampaign(goal.id)}
                     className={`cursor-pointer transition-all ${selectedGoal === goal.id
                           ? 'ring-2 ring-blue-500 bg-blue-50'
                           : 'hover:bg-slate-50'
                        }`}
                  >
                     <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${goal.color}`}>
                           <goal.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-slate-900">{goal.title}</h4>
                           <p className="text-sm text-slate-600">{goal.description}</p>
                        </div>
                        {selectedGoal === goal.id && (
                           <div className="flex items-center gap-1">
                              <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
                           </div>
                        )}
                     </div>
                  </Card>
               ))}
            </div>
         </div>

         {/* Campaign Preview */}
         {campaign && (
            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-slate-700">Step 2: Review Campaign</h3>
               <Card padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <div className="space-y-4">
                     <div>
                        <Badge variant="info" size="sm" className="mb-2">
                           Recommended Campaign
                        </Badge>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">{campaign.title}</h4>
                        <p className="text-sm text-slate-700">{campaign.description}</p>
                     </div>

                     <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200">
                        <div>
                           <p className="text-xs font-semibold text-slate-600 mb-1">Platform</p>
                           <p className="text-sm font-bold text-slate-900">{campaign.platform}</p>
                        </div>
                        <div>
                           <p className="text-xs font-semibold text-slate-600 mb-1">Est. Budget</p>
                           <p className="text-sm font-bold text-slate-900">{campaign.budget}</p>
                        </div>
                        <div className="col-span-2">
                           <p className="text-xs font-semibold text-slate-600 mb-1">Estimated Reach</p>
                           <p className="text-sm font-bold text-slate-900">{campaign.reach}</p>
                        </div>
                     </div>
                  </div>
               </Card>

               <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Step 3: Launch Campaign</h3>
                  <div className="space-y-2">
                     <Button className="w-full" size="lg">
                        <Rocket className="w-5 h-5 mr-2" />
                        Launch Campaign
                     </Button>
                     <Button variant="secondary" className="w-full" onClick={() => setCampaign(null)}>
                        Choose Different Goal
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Empty State */}
         {!campaign && !loading && (
            <Card>
               <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Advertise?</h3>
                  <p className="text-slate-600">Select your goal above to generate a smart campaign</p>
               </div>
            </Card>
         )}
      </div>
   );
};

export default SmartAdsPage;
