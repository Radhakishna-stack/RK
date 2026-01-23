import React, { useState, useEffect } from 'react';
import { Globe, Star, MessageSquare, MapPin, ExternalLink, Send, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface Review {
   id: string;
   author: string;
   rating: number;
   text: string;
   date: string;
   reply?: string;
}

const GoogleProfilePage: React.FC = () => {
   const [reviews, setReviews] = useState<Review[]>([
      {
         id: '1',
         author: 'Rajesh Kumar',
         rating: 5,
         text: 'Excellent service! Very professional and quick turnaround time.',
         date: '2024-01-20'
      },
      {
         id: '2',
         author: 'Priya Sharma',
         rating: 4,
         text: 'Good service but slightly expensive. Overall satisfied with the work.',
         date: '2024-01-18'
      },
      {
         id: '3',
         author: 'Amit Singh',
         rating: 5,
         text: 'Best bike service center in the area. Highly recommended!',
         date: '2024-01-15'
      }
   ]);
   const [replyingTo, setReplyingTo] = useState<string | null>(null);
   const [replyText, setReplyText] = useState('');
   const [generatingAI, setGeneratingAI] = useState(false);

   const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

   const generateAIReply = async (review: Review) => {
      setGeneratingAI(true);
      setReplyingTo(review.id);

      try {
         const apiKey = localStorage.getItem('gemini_api_key') || '';
         if (!apiKey) {
            setReplyText('Thank you for your feedback! We appreciate your business.');
            setGeneratingAI(false);
            return;
         }

         const genai = new GoogleGenAI({ apiKey });
         const prompt = `Generate a professional, friendly reply to this customer review for a bike service workshop:
Review (${review.rating}/5): "${review.text}"

Write a brief, warm response (2-3 sentences) that:
- Thanks the customer
- Addresses any concerns if rating < 5
- Invites them to return
Keep it concise and professional.`;

         const result = await genai.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { temperature: 0.7, maxOutputTokens: 150 }
         });

         setReplyText(result.text || 'Thank you for your feedback!');
      } catch (err) {
         setReplyText('Thank you for your valuable feedback! We look forward to serving you again.');
      } finally {
         setGeneratingAI(false);
      }
   };

   const handleSendReply = (reviewId: string) => {
      setReviews(reviews.map(r =>
         r.id === reviewId ? { ...r, reply: replyText } : r
      ));
      setReplyingTo(null);
      setReplyText('');
   };

   return (
      <div className="space-y-6">
         {/* Header */}
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Google Business Profile</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your online presence</p>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
               <div>
                  <p className="text-sm text-blue-100 mb-1">Average Rating</p>
                  <div className="flex items-center gap-2">
                     <h2 className="text-4xl font-bold">{averageRating.toFixed(1)}</h2>
                     <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />
                  </div>
               </div>
            </Card>

            <Card className="bg-white">
               <div>
                  <p className="text-sm text-slate-600 mb-1">Total Reviews</p>
                  <h2 className="text-4xl font-bold text-blue-600">{reviews.length}</h2>
               </div>
            </Card>
         </div>

         {/* Quick Actions */}
         <div className="grid grid-cols-2 gap-3">
            <Button
               variant="secondary"
               onClick={() => window.open('https://business.google.com', '_blank')}
            >
               <Globe className="w-4 h-4 mr-2" />
               Open Google
            </Button>
            <Button
               variant="secondary"
               onClick={() => window.open('https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID', '_blank')}
            >
               <ExternalLink className="w-4 h-4 mr-2" />
               View Profile
            </Button>
         </div>

         {/* Reviews */}
         <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Recent Reviews</h3>
            <div className="space-y-3">
               {reviews.map((review) => (
                  <Card key={review.id} padding="md">
                     <div className="space-y-3">
                        <div className="flex items-start justify-between">
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="font-bold text-slate-900">{review.author}</h4>
                                 <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                       <Star
                                          key={i}
                                          className={`w-4 h-4 ${i < review.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-slate-300'
                                             }`}
                                       />
                                    ))}
                                 </div>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{review.text}</p>
                              <p className="text-xs text-slate-500">
                                 {new Date(review.date).toLocaleDateString()}
                              </p>
                           </div>
                        </div>

                        {/* Reply Section */}
                        {review.reply ? (
                           <div className="pl-4 border-l-2 border-blue-200 bg-blue-50 p-3 rounded-r-xl">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Your Reply</p>
                              <p className="text-sm text-slate-700">{review.reply}</p>
                           </div>
                        ) : replyingTo === review.id ? (
                           <div className="space-y-2 pt-2 border-t border-slate-200">
                              <textarea
                                 value={replyText}
                                 onChange={(e) => setReplyText(e.target.value)}
                                 placeholder="Write your reply..."
                                 className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                 rows={3}
                              />
                              <div className="flex gap-2">
                                 <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                       setReplyingTo(null);
                                       setReplyText('');
                                    }}
                                    className="flex-1"
                                 >
                                    Cancel
                                 </Button>
                                 <Button
                                    size="sm"
                                    onClick={() => handleSendReply(review.id)}
                                    disabled={!replyText.trim()}
                                    className="flex-1"
                                 >
                                    <Send className="w-4 h-4 mr-1" />
                                    Send Reply
                                 </Button>
                              </div>
                           </div>
                        ) : (
                           <div className="flex gap-2 pt-2 border-t border-slate-200">
                              <Button
                                 size="sm"
                                 variant="secondary"
                                 onClick={() => generateAIReply(review)}
                                 isLoading={generatingAI && replyingTo === review.id}
                                 className="flex-1"
                              >
                                 <Sparkles className="w-4 h-4 mr-1" />
                                 AI Reply
                              </Button>
                              <Button
                                 size="sm"
                                 variant="ghost"
                                 onClick={() => setReplyingTo(review.id)}
                                 className="flex-1"
                              >
                                 <MessageSquare className="w-4 h-4 mr-1" />
                                 Write Reply
                              </Button>
                           </div>
                        )}
                     </div>
                  </Card>
               ))}
            </div>
         </div>
      </div>
   );
};

export default GoogleProfilePage;
