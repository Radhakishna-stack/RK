import React from 'react';
import { Complaint, ComplaintStatus } from '../types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface JobTimelineProps {
  job: Complaint;
}

const STAGES = [
  { status: ComplaintStatus.NEW, label: 'Created' },
  { status: ComplaintStatus.ASSIGNED, label: 'Assigned' },
  { status: ComplaintStatus.ACCEPTED, label: 'Accepted' },
  { status: ComplaintStatus.IN_PROGRESS, label: 'In Progress' },
  { status: ComplaintStatus.READY, label: 'Ready for QC' },
  { status: ComplaintStatus.QC_APPROVED, label: 'QC Approved' },
  { status: ComplaintStatus.DELIVERED, label: 'Delivered' },
];

export const JobTimeline: React.FC<JobTimelineProps> = ({ job }) => {
  // Find current stage index
  let currentIndex = STAGES.findIndex(s => s.status === job.status);
  
  // Handle COMPLETED alias
  if (job.status === ComplaintStatus.COMPLETED) {
    currentIndex = STAGES.findIndex(s => s.status === ComplaintStatus.DELIVERED);
  } else if (job.status === ComplaintStatus.PENDING) {
    currentIndex = STAGES.findIndex(s => s.status === ComplaintStatus.NEW);
  }

  // If Cancelled, show special state
  if (job.status === ComplaintStatus.CANCELLED) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 font-medium p-3 bg-red-50 rounded-xl">
        <Circle className="w-4 h-4 fill-current" />
        Job Cancelled
      </div>
    );
  }

  return (
    <div className="relative pt-6 pb-2">
      {/* Connecting line */}
      <div className="absolute top-8 left-4 right-4 h-1 bg-slate-100 rounded-full" />
      <div 
        className="absolute top-8 left-4 h-1 bg-blue-500 rounded-full transition-all duration-500" 
        style={{ width: `calc(${Math.max(0, currentIndex) / (STAGES.length - 1)} * calc(100% - 32px))` }} 
      />

      <div className="flex justify-between relative z-10 px-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={stage.status} className="flex flex-col items-center gap-2 w-16 group">
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-white
                  ${isCompleted ? 'border-blue-500 text-blue-500' : 'border-slate-200 text-slate-300'}
                  ${isCurrent ? 'ring-4 ring-blue-50' : ''}
                `}
              >
                {isCompleted ? (
                   <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                   <Circle className="w-2.5 h-2.5 fill-current" />
                )}
              </div>
              <span className={`text-[10px] font-bold text-center leading-tight transition-colors duration-300
                ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}
              `}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {job.workNotes && job.workNotes.length > 0 && (
         <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
             <Clock className="w-3.5 h-3.5" />
             Work Notes & Audit Trail
           </h4>
           <div className="space-y-3">
             {job.workNotes.map((note, i) => (
               <div key={i} className="flex gap-3 text-sm">
                 <div className="relative pt-1 flex flex-col items-center">
                   <div className="w-2 h-2 rounded-full bg-blue-400 z-10" />
                   {i !== job.workNotes!.length - 1 && <div className="w-px h-full bg-slate-200 absolute top-3" />}
                 </div>
                 <div>
                   <p className="text-slate-700"><span className="font-semibold text-slate-900">{note.userName}</span>: {note.text}</p>
                   <p className="text-[10px] text-slate-400 font-medium">{(new Date(note.timestamp)).toLocaleString('en-IN')}</p>
                 </div>
               </div>
             ))}
           </div>
         </div>
      )}
    </div>
  );
};
