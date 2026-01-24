import React, { useState } from 'react';
import { Sparkles, Target, Rocket, MessageCircle, Star, Zap, Image as ImageIcon, Share2, Copy, Download, Facebook, Instagram, Send } from 'lucide-react';
import { dbService } from '../db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

interface AdCampaign {
   id: string;
   title: string;
   description: string;
   platform: string;
   budget: string;
   reach: string;
}

const SmartAdsPage: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'strategy' | 'creative'>('creative');
   const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
   const [campaign, setCampaign] = useState<AdCampaign | null>(null);
   const [loading, setLoading] = useState(false);

   // Creative Mode State
   const [topic, setTopic] = useState('');
   const [generatedContent, setGeneratedContent] = useState<{
      image: string;
      caption: string;
      tags: string;
   } | null>(null);
   const [generating, setGenerating] = useState(false);

   const goals = [
      { id: 'awareness', icon: Sparkles, title: 'Brand Awareness', description: 'Get your business noticed', color: 'bg-purple-100 text-purple-600' },
      { id: 'traffic', icon: Rocket, title: 'More Customers', description: 'Drive foot traffic to shop', color: 'bg-blue-100 text-blue-600' },
      { id: 'engagement', icon: MessageCircle, title: 'Customer Engagement', description: 'Build relationships', color: 'bg-green-100 text-green-600' }
   ];

   const generateCampaign = async (goalId: string) => {
      setLoading(true);
      setSelectedGoal(goalId);
      try {
         await dbService.getAdSuggestions('Automobile'); // Mock call to wake up AI if needed
         const campaigns: Record<string, AdCampaign> = {
            awareness: { id: '1', title: 'Grand Opening Special', description: 'Showcase your premium bike service.', platform: 'Facebook & Instagram', budget: '₹5,000 - ₹10,000', reach: '10k - 15k people' },
            traffic: { id: '2', title: 'Weekend Service Drive', description: '50% off on first service!', platform: 'Google Ads', budget: '₹3,000 - ₹7,000', reach: '5k - 8k people' },
            engagement: { id: '3', title: 'Customer Loyalty Program', description: 'Points-based rewards system.', platform: 'WhatsApp & SMS', budget: '₹2,000 - ₹5,000', reach: '3k - 5k customers' }
         };
         setCampaign(campaigns[goalId] || campaigns.awareness);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
   };

   const handleGenerateCreative = async () => {
      if (!topic) return alert("Please enter a topic");
      setGenerating(true);
      setGeneratedContent(null);

      try {
         const [image, text] = await Promise.all([
            dbService.generateAdImage(topic),
            dbService.generateMarketingContent(topic)
         ]);

         setGeneratedContent({
            image,
            caption: text.caption,
            tags: text.tags
         });
      } catch (err) {
         console.error(err);
         alert("Failed to generate content. Please try again.");
      } finally {
         setGenerating(false);
      }
   };

   const shareToWhatsApp = () => {
      if (!generatedContent) return;
      const text = `${generatedContent.caption}\n\n${generatedContent.tags}`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
   };

   const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
   };

   const downloadImage = () => {
      if (!generatedContent?.image) return;
      const link = document.createElement('a');
      link.href = generatedContent.image;
      link.download = `ad-creative-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Smart Ads Studio</h1>
               <p className="text-sm text-slate-600 mt-1">AI-powered marketing & content creation</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
               <button
                  onClick={() => setActiveTab('creative')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'creative' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}
               >
                  Social Post Creator
               </button>
               <button
                  onClick={() => setActiveTab('strategy')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'strategy' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}
               >
                  Campaign Strategy
               </button>
            </div>
         </div>

         {activeTab === 'strategy' ? (
            // Strategy View (Existing)
            <div className="space-y-6">
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
               <div className="grid grid-cols-1 gap-3">
                  {goals.map((goal) => (
                     <Card key={goal.id} padding="md" onClick={() => generateCampaign(goal.id)} className={`cursor-pointer transition-all ${selectedGoal === goal.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${goal.color}`}><goal.icon className="w-6 h-6" /></div>
                           <div className="flex-1"><h4 className="font-bold text-slate-900">{goal.title}</h4><p className="text-sm text-slate-600">{goal.description}</p></div>
                           {selectedGoal === goal.id && <Star className="w-5 h-5 fill-blue-600 text-blue-600" />}
                        </div>
                     </Card>
                  ))}
               </div>
               {campaign && (
                  <Card padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                     <Badge variant="info" size="sm" className="mb-2">Recommended Strategy</Badge>
                     <h4 className="text-xl font-bold text-slate-900 mb-2">{campaign.title}</h4>
                     <p className="text-sm text-slate-700 mb-4">{campaign.description}</p>
                     <div className="grid grid-cols-3 gap-3 pt-3 border-t border-blue-200">
                        <div><p className="text-xs font-semibold text-slate-600">Platform</p><p className="text-sm font-bold">{campaign.platform}</p></div>
                        <div><p className="text-xs font-semibold text-slate-600">Budget</p><p className="text-sm font-bold">{campaign.budget}</p></div>
                        <div><p className="text-xs font-semibold text-slate-600">Reach</p><p className="text-sm font-bold">{campaign.reach}</p></div>
                     </div>
                  </Card>
               )}
            </div>
         ) : (
            // Creative View (New)
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="space-y-6">
                  <Card title="Content Generator">
                     <p className="text-sm text-slate-600 mb-4">Enter a topic to generate a professional social media post image and caption.</p>

                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-1">Topic / Offer</label>
                           <Input
                              placeholder="e.g., Monsoon Bike Checkup Camp, 20% Off on Oil Change"
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                           />
                        </div>

                        <Button
                           onClick={handleGenerateCreative}
                           isLoading={generating}
                           className="w-full"
                        >
                           <Sparkles className="w-5 h-5 mr-2" />
                           {generating ? 'Designing...' : 'Generate Creative'}
                        </Button>
                     </div>
                  </Card>

                  {generatedContent && (
                     <Card title="Share & Export">
                        <div className="grid grid-cols-2 gap-3">
                           <Button variant="outline" onClick={shareToWhatsApp} className="w-full justify-start text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
                              <MessageCircle className="w-5 h-5 mr-2" />
                              WhatsApp
                           </Button>
                           <Button variant="outline" onClick={() => copyToClipboard(`${generatedContent.caption} ${generatedContent.tags}`)} className="w-full justify-start">
                              <Copy className="w-5 h-5 mr-2" />
                              Copy Text
                           </Button>
                           <Button variant="outline" onClick={downloadImage} className="w-full justify-start">
                              <Download className="w-5 h-5 mr-2" />
                              Download Img
                           </Button>
                           <div className="col-span-2 text-xs text-center text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                              Tip: Download image & copy text, then paste in Instagram/Facebook.
                           </div>
                        </div>
                     </Card>
                  )}
               </div>

               <div>
                  {generatedContent ? (
                     <Card className="overflow-hidden border-2 border-slate-200">
                        <div className="aspect-square bg-slate-100 relative group">
                           <img src={generatedContent.image} alt="Generated Ad" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="secondary" size="sm" onClick={downloadImage}>Download</Button>
                           </div>
                        </div>
                        <div className="p-4 bg-white">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200" />
                              <div className="font-bold text-sm">Moto Gear SRK</div>
                           </div>
                           <textarea
                              className="w-full text-sm text-slate-800 border-none resize-none focus:ring-0 p-0 h-24 bg-transparent font-medium"
                              value={generatedContent.caption}
                              onChange={(e) => setGeneratedContent({ ...generatedContent, caption: e.target.value })}
                           />
                           <p className="text-blue-600 text-sm mt-2 font-medium">{generatedContent.tags}</p>
                        </div>
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-500">
                           <div className="flex gap-4">
                              <Share2 className="w-5 h-5" />
                              <MessageCircle className="w-5 h-5" />
                              <Send className="w-5 h-5" />
                           </div>
                           <Badge variant="success" size="sm">Ready to Post</Badge>
                        </div>
                     </Card>
                  ) : (
                     <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                        <h3 className="text-lg font-semibold text-slate-600">No Content Generated</h3>
                        <p className="text-sm max-w-xs mt-2">Enter a topic and hit generate to see the AI magic happen here.</p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default SmartAdsPage;
