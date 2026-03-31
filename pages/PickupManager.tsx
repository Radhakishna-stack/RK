import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus, MapPin, User, Phone, Bike, Clock, CheckCircle2, Truck, X,
  ArrowLeft, Navigation, UserCheck, Search, Share2, ExternalLink,
  Users, RefreshCw, MoreHorizontal, Radio, Eye, ChevronDown
} from 'lucide-react';
import { dbService } from '../db';
import { PickupRequest, PickupStatus, PickupType, Salesman, Visitor } from '../types';

interface Props { onNavigate: (t: string) => void; }

// ── Stage config ──────────────────────────────────────────────────────────
const STAGES = [
  { key: 'New' as PickupStatus,      label: 'NEW',       color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200',       badge: 'bg-sky-100 text-sky-700',     dot: 'bg-sky-400',     icon: <Clock size={13}/> },
  { key: 'Assigned' as PickupStatus, label: 'ASSIGNED',  color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400', icon: <UserCheck size={13}/> },
  { key: 'Accepted' as PickupStatus, label: 'ACCEPTED',  color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-400', icon: <CheckCircle2 size={13}/> },
  { key: 'En Route' as PickupStatus, label: 'EN ROUTE',  color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400', icon: <Navigation size={13}/> },
  { key: 'At Pickup' as PickupStatus,label: 'AT PICKUP', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',badge: 'bg-emerald-100 text-emerald-700',dot:'bg-emerald-400',icon: <MapPin size={13}/> },
  { key: 'Completed' as PickupStatus,label: 'COMPLETED', color: 'text-slate-600',  bg: 'bg-slate-100 border-slate-200',  badge: 'bg-slate-200 text-slate-600',   dot: 'bg-slate-400',  icon: <CheckCircle2 size={13}/> },
];

const LEGACY: Record<string, PickupStatus> = {
  'Pending': 'New', 'In Transit': 'En Route', 'Picked Up': 'At Pickup', 'Delivered': 'Completed'
};
const normalize = (s: string): PickupStatus => (LEGACY[s] as PickupStatus) || (s as PickupStatus);

const TYPE_COLORS: Record<string, string> = {
  Breakdown: 'bg-red-50 text-red-700', Emergency: 'bg-orange-50 text-orange-700',
  Scheduled:  'bg-blue-50 text-blue-700', Delivery:  'bg-green-50 text-green-700',
};

// ── Mock data ─────────────────────────────────────────────────────────────
const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString();
const now = () => new Date().toISOString();

const MOCK_PICKUPS: PickupRequest[] = [
  { id:'PU-001', customerName:'Rajesh Kumar',   customerPhone:'98765 43210', bikeNumber:'TN 01 AB 1234', issueDescription:"Engine won't start near Anna Nagar. Needs towing.", locationLink:'https://maps.google.com/?q=13.083,80.270', pickupType:'Breakdown', status:'New',      createdAt:ago(12), updatedAt:now(), notes:'Customer waiting at spot' },
  { id:'PU-002', customerName:'Priya Lakshmi',  customerPhone:'97654 32100', bikeNumber:'TN 09 CD 5678', issueDescription:'Flat tyre. Can\'t ride. Near T.Nagar.', locationLink:'', pickupType:'Emergency', status:'New',      createdAt:ago(5),  updatedAt:now() },
  { id:'PU-003', customerName:'Karthik R.',     customerPhone:'96543 21000', bikeNumber:'TN 22 EF 9012', issueDescription:'Scheduled 3rd service pickup by 10 AM.', locationLink:'https://maps.google.com/?q=13.078,80.289', pickupType:'Scheduled', status:'New', createdAt:ago(45), updatedAt:now() },
  { id:'PU-004', customerName:'Divya Sharma',   customerPhone:'95432 10001', bikeNumber:'TN 03 GH 3456', issueDescription:'Bad vibration at high speed. Urgent check needed.', locationLink:'https://maps.google.com/?q=13.091,80.278', pickupType:'Breakdown', status:'Assigned', assignedEmployeeId:'EMP-001', assignedEmployeeName:'Ravi Kumar', createdAt:ago(62), updatedAt:ago(15) },
  { id:'PU-005', customerName:'Suresh Babu',    customerPhone:'94321 00987', bikeNumber:'TN 14 IJ 7890', issueDescription:'Annual service pickup. Home delivery needed.', locationLink:'', pickupType:'Scheduled', status:'Assigned', assignedEmployeeId:'EMP-002', assignedEmployeeName:'Mohan D.', createdAt:ago(80), updatedAt:ago(20) },
  { id:'PU-006', customerName:'Anita Krishnan', customerPhone:'93210 09876', bikeNumber:'TN 07 KL 2345', issueDescription:'Chain came off and brake issue.', locationLink:'https://maps.google.com/?q=13.077,80.261', pickupType:'Breakdown', status:'Accepted', assignedEmployeeId:'EMP-001', assignedEmployeeName:'Ravi Kumar', createdAt:ago(95), updatedAt:ago(30) },
  { id:'PU-007', customerName:'Venkat Rao',     customerPhone:'92109 87654', bikeNumber:'TN 18 MN 6789', issueDescription:'Engine oil leak. Cannot use bike at all.', locationLink:'', pickupType:'Emergency', status:'Accepted', assignedEmployeeId:'EMP-003', assignedEmployeeName:'Siva P.', createdAt:ago(110), updatedAt:ago(40) },
  { id:'PU-008', customerName:'Meera Nair',     customerPhone:'91098 76543', bikeNumber:'TN 05 OP 0123', issueDescription:'Bike not starting in rain. Stranded on ECR.', locationLink:'https://maps.google.com/?q=12.975,80.251', pickupType:'Emergency', status:'En Route', assignedEmployeeId:'EMP-002', assignedEmployeeName:'Mohan D.', createdAt:ago(130), updatedAt:ago(10) },
  { id:'PU-009', customerName:'Arun Balaji',    customerPhone:'90987 65432', bikeNumber:'TN 11 QR 4567', issueDescription:'2nd service scheduled pickup from Adyar.', locationLink:'https://maps.google.com/?q=13.062,80.248', pickupType:'Scheduled', status:'En Route', assignedEmployeeId:'EMP-004', assignedEmployeeName:'Arulraj K.', createdAt:ago(150), updatedAt:ago(18) },
  { id:'PU-010', customerName:'Kavitha S.',     customerPhone:'89876 54321', bikeNumber:'TN 21 ST 8901', issueDescription:'Clutch wire snapped. Urgent pickup.', locationLink:'https://maps.google.com/?q=13.098,80.281', pickupType:'Emergency', status:'At Pickup', assignedEmployeeId:'EMP-001', assignedEmployeeName:'Ravi Kumar', createdAt:ago(200), updatedAt:ago(8) },
  { id:'PU-011', customerName:'Gokul M.',       customerPhone:'88765 43210', bikeNumber:'TN 02 UV 2345', issueDescription:'Full service done, delivering bike back.', locationLink:'', pickupType:'Delivery', status:'Completed', assignedEmployeeId:'EMP-005', assignedEmployeeName:'Dinesh R.', createdAt:ago(480), updatedAt:ago(60) },
  { id:'PU-012', customerName:'Saranya Devi',   customerPhone:'87654 32109', bikeNumber:'TN 33 WX 6789', issueDescription:'Breakdown handled. Bike repaired and returned.', locationLink:'', pickupType:'Breakdown', status:'Completed', assignedEmployeeId:'EMP-003', assignedEmployeeName:'Siva P.', createdAt:ago(360), updatedAt:ago(90) },
];

type StaffMember = Salesman & { mapX: number; mapY: number; currentTask?: string; };
const MOCK_STAFF: StaffMember[] = [
  { id:'EMP-001', name:'Ravi Kumar',  phone:'98100 11122', target:50, salesCount:38, totalSalesValue:0, joinDate:'2023-01-15', status:'On Task',   targetArea:'North Chennai', mapX:40, mapY:28, currentTask:'Kavitha S. – At Pickup' },
  { id:'EMP-002', name:'Mohan D.',    phone:'98100 33344', target:50, salesCount:25, totalSalesValue:0, joinDate:'2023-03-20', status:'On Task',   targetArea:'South Chennai', mapX:27, mapY:67, currentTask:'Meera Nair – En Route' },
  { id:'EMP-003', name:'Siva P.',     phone:'98100 55566', target:50, salesCount:42, totalSalesValue:0, joinDate:'2022-08-10', status:'Available', targetArea:'Central',       mapX:58, mapY:46 },
  { id:'EMP-004', name:'Arulraj K.', phone:'98100 77788', target:50, salesCount:17, totalSalesValue:0, joinDate:'2024-01-08', status:'On Task',   targetArea:'East Chennai',  mapX:75, mapY:58, currentTask:'Arun Balaji – En Route' },
  { id:'EMP-005', name:'Dinesh R.',   phone:'98100 99900', target:50, salesCount:31, totalSalesValue:0, joinDate:'2023-06-15', status:'Offline',   targetArea:'West Chennai',  mapX:17, mapY:41 },
];

const STAFF_CFG = {
  'Available': { dot:'bg-emerald-400', badge:'bg-emerald-100 text-emerald-700', hex:'#10b981' },
  'On Task':   { dot:'bg-orange-400',  badge:'bg-orange-100 text-orange-700',   hex:'#f97316' },
  'Offline':   { dot:'bg-slate-300',   badge:'bg-slate-100 text-slate-500',     hex:'#94a3b8' },
} as const;

// ── Sub-components ────────────────────────────────────────────────────────
const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
};

const PickupCard: React.FC<{
  pickup: PickupRequest; stage: typeof STAGES[0];
  onMove: (id: string, s: PickupStatus) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
}> = ({ pickup, stage, onMove, onDelete, onDragStart }) => {
  const [menu, setMenu] = useState(false);
  const nextStage = STAGES[STAGES.findIndex(s => s.key === normalize(pickup.status)) + 1];
  return (
    <div
      draggable onDragStart={() => onDragStart(pickup.id)}
      className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex-1 min-w-0">
          <span className="font-bold text-slate-900 text-sm block leading-tight truncate">{pickup.customerName}</span>
          <code className="text-[11px] font-mono text-slate-400 mt-0.5 block">{pickup.bikeNumber}</code>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {pickup.pickupType && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[pickup.pickupType] || 'bg-slate-100 text-slate-600'}`}>{pickup.pickupType}</span>
          )}
          <div className="relative">
            <button onClick={() => setMenu(m => !m)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><MoreHorizontal size={14}/></button>
            {menu && (
              <div className="absolute right-0 top-7 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36">
                {STAGES.filter(s => s.key !== normalize(pickup.status)).map(s => (
                  <button key={s.key} onClick={() => { onMove(pickup.id, s.key); setMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`}/> Move → {s.label}
                  </button>
                ))}
                <hr className="my-1 border-slate-100"/>
                <button onClick={() => { onDelete(pickup.id); setMenu(false); }} className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">{pickup.issueDescription}</p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500 flex items-center gap-1">
          {pickup.assignedEmployeeName
            ? <><User size={10} className="text-blue-500"/><span className="text-blue-700 font-semibold truncate max-w-[90px]">{pickup.assignedEmployeeName}</span></>
            : <span className="text-slate-400">Unassigned</span>}
        </div>
        <div className="flex items-center gap-1">
          {pickup.locationLink && (
            <a href={pickup.locationLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><MapPin size={11}/></a>
          )}
          <span className="text-[10px] text-slate-400">{timeAgo(pickup.createdAt)}</span>
        </div>
      </div>

      {nextStage && (
        <button onClick={() => onMove(pickup.id, nextStage.key)}
          className={`mt-2 w-full text-[11px] font-bold py-1.5 rounded-lg border ${stage.badge} ${stage.color} ${stage.bg} hover:opacity-80 flex items-center justify-center gap-1`}>
          {nextStage.icon} → {nextStage.label}
        </button>
      )}
    </div>
  );
};

const KanbanColumn: React.FC<{
  stage: typeof STAGES[0]; pickups: PickupRequest[];
  onMove: (id: string, s: PickupStatus) => void; onDelete: (id: string) => void;
  onDragStart: (id: string) => void; onDrop: (s: PickupStatus) => void;
  isOver: boolean; setOver: (k: string | null) => void;
}> = ({ stage, pickups, onMove, onDelete, onDragStart, onDrop, isOver, setOver }) => (
  <div
    className={`flex-shrink-0 w-[272px] flex flex-col rounded-2xl border-2 transition-all ${stage.bg} ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 scale-[1.015]' : ''}`}
    onDragOver={e => { e.preventDefault(); setOver(stage.key); }}
    onDragLeave={() => setOver(null)}
    onDrop={e => { e.preventDefault(); onDrop(stage.key); setOver(null); }}
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
      <div className="flex items-center gap-2">
        <span className={stage.color}>{stage.icon}</span>
        <span className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>{stage.label}</span>
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.badge}`}>{pickups.length}</span>
    </div>
    <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[500px] min-h-[80px]">
      {pickups.length === 0
        ? <div className={`border-2 border-dashed rounded-xl p-6 text-center opacity-40 ${stage.color}`}><p className="text-xs font-semibold">Drop pickups here</p></div>
        : pickups.map(p => <PickupCard key={p.id} pickup={p} stage={stage} onMove={onMove} onDelete={onDelete} onDragStart={onDragStart}/>)
      }
    </div>
  </div>
);

// ── Staff Map ─────────────────────────────────────────────────────────────
const StaffMap: React.FC<{ staff: StaffMember[] }> = ({ staff }) => {
  const [sel, setSel] = useState<string|null>(null);
  return (
    <div className="relative h-[580px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0L0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/>
          </pattern>
          <pattern id="bigGrid" width="150" height="150" patternUnits="userSpaceOnUse">
            <rect width="150" height="150" fill="url(#grid)"/>
            <path d="M150 0L0 0 0 150" fill="none" stroke="#94a3b8" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bigGrid)"/>
        {/* Roads */}
        <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#93c5fd" strokeWidth="8" strokeOpacity="0.5"/>
        <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#93c5fd" strokeWidth="5" strokeOpacity="0.4"/>
        <line x1="33%" y1="0" x2="33%" y2="100%" stroke="#93c5fd" strokeWidth="8" strokeOpacity="0.5"/>
        <line x1="65%" y1="0" x2="65%" y2="100%" stroke="#93c5fd" strokeWidth="5" strokeOpacity="0.4"/>
        {/* Park */}
        <rect x="66%" y="15%" width="18%" height="22%" rx="12" fill="#86efac" opacity="0.5"/>
        {/* Lake */}
        <ellipse cx="82%" cy="78%" rx="10%" ry="7%" fill="#7dd3fc" opacity="0.4"/>
        {/* Road labels */}
        <text x="34%" y="33%" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">MAIN ROAD</text>
        <text x="34%" y="63%" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">BYPASS ROAD</text>
      </svg>

      {/* Zone labels */}
      <div className="absolute top-3 left-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest">North Zone</div>
      <div className="absolute bottom-12 left-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">South Zone</div>
      <div className="absolute top-16 right-3 text-xs font-bold text-emerald-600">🌳 Park</div>
      <div className="absolute bottom-8 right-12 text-xs text-blue-500">💧 Lake</div>

      {/* Shop */}
      <div className="absolute" style={{top:'48%',left:'48%',transform:'translate(-50%,-50%)'}}>
        <div className="relative flex flex-col items-center">
          <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center shadow-xl border-3 border-white z-10">
            <Truck size={18} color="white"/>
          </div>
          <div className="absolute -bottom-7 whitespace-nowrap text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold shadow">SRK Shop</div>
        </div>
      </div>

      {/* Staff markers */}
      {staff.map(m => {
        const cfg = STAFF_CFG[m.status as keyof typeof STAFF_CFG] ?? STAFF_CFG['Offline'];
        const isSel = sel === m.id;
        return (
          <button key={m.id} onClick={() => setSel(isSel ? null : m.id)}
            className="absolute z-20" style={{top:`${m.mapY}%`, left:`${m.mapX}%`, transform:'translate(-50%,-50%)'}}>
            {m.status === 'On Task' && <div className="absolute w-10 h-10 rounded-full border-2 border-orange-400 animate-ping opacity-40" style={{top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>}
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-transform hover:scale-110 active:scale-95"
              style={{background: cfg.hex}}>
              <User size={14} color="white"/>
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-white text-slate-700 px-1.5 py-0.5 rounded-full font-bold shadow border border-slate-100">
              {m.name.split(' ')[0]}
            </div>
            {isSel && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 w-44 text-left pointer-events-none">
                <div className="font-bold text-sm text-slate-900">{m.name}</div>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot.split(' ')[0]}`}/>{m.status}
                </span>
                {m.currentTask && <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-1.5 leading-snug">📍 {m.currentTask}</p>}
                <p className="text-[10px] text-slate-400 mt-1">{m.targetArea}</p>
              </div>
            )}
          </button>
        );
      })}

      {/* Floating staff panel */}
      <div className="absolute top-3 right-3 w-52 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2"><Users size={14} className="text-blue-600"/><span className="text-sm font-bold text-slate-800">Field Staff</span></div>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{staff.length}</span>
        </div>
        <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
          {staff.map(m => {
            const cfg = STAFF_CFG[m.status as keyof typeof STAFF_CFG] ?? STAFF_CFG['Offline'];
            return (
              <button key={m.id} onClick={() => setSel(sel === m.id ? null : m.id)}
                className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-left transition-colors ${sel===m.id?'bg-blue-50':''}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot.split(' ')[0]} ${m.status==='On Task'?'animate-pulse':''}`}/>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{m.currentTask || m.targetArea}</div>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>{m.status}</span>
              </button>
            );
          })}
        </div>
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex gap-3">
          {Object.entries(STAFF_CFG).map(([s,cfg]) => (
            <div key={s} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${cfg.dot.split(' ')[0]}`}/>
              <span className="text-[9px] text-slate-500 font-medium">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom UI */}
      <div className="absolute top-3 left-3 flex flex-col bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <button className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-lg">+</button>
        <div className="h-px bg-slate-100"/>
        <button className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-lg">−</button>
      </div>
      <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-white/80 px-2 py-0.5 rounded">Chennai Metro · Live View</div>
    </div>
  );
};

// ── Step Tracker ──────────────────────────────────────────────────────────
const StepTracker: React.FC<{ pickups: PickupRequest[]; activeFilter: PickupStatus|null; onFilter:(s:PickupStatus|null)=>void }> =
  ({ pickups, activeFilter, onFilter }) => {
  const counts = Object.fromEntries(STAGES.map(s => [s.key, pickups.filter(p => normalize(p.status) === s.key).length]));
  return (
    <div className="flex items-center overflow-x-auto no-scrollbar py-2 gap-0 px-1">
      {STAGES.map((stage, i) => (
        <React.Fragment key={stage.key}>
          <button onClick={() => onFilter(activeFilter === stage.key ? null : stage.key)}
            className={`flex flex-col items-center min-w-[84px] cursor-pointer px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors ${activeFilter===stage.key?'bg-slate-100 ring-2 ring-slate-300':''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 mb-1.5 ${stage.badge} ${stage.bg}`}>{i+1}</div>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${stage.color} whitespace-nowrap`}>{stage.label}</div>
            <div className={`text-xs font-bold mt-0.5 ${counts[stage.key]>0?'text-slate-800':'text-slate-300'}`}>{counts[stage.key]}</div>
          </button>
          {i < STAGES.length-1 && <div className="flex-1 h-0.5 bg-slate-200 min-w-[8px]"/>}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── New Pickup Modal ──────────────────────────────────────────────────────
const NewPickupModal: React.FC<{
  staff: StaffMember[]; onClose:()=>void; onSave:(d:any)=>Promise<void>;
}> = ({ staff, onClose, onSave }) => {
  const [form, setForm] = useState({ customerName:'', customerPhone:'', bikeNumber:'', issueDescription:'', locationLink:'', notes:'', pickupType:'Breakdown' as PickupType, assignedEmployeeId:'' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f=>({...f,[k]:v}));
  const handleSave = async () => {
    if (!form.customerName||!form.customerPhone||!form.bikeNumber||!form.issueDescription) { alert('Fill required fields'); return; }
    setSaving(true); await onSave(form); setSaving(false);
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100 z-10">
          <div><h2 className="font-bold text-slate-900 text-lg">New Pickup Request</h2><p className="text-xs text-slate-400 mt-0.5">Fill from WhatsApp or direct call</p></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[{k:'customerName',label:'Customer Name *',ph:'Full name',icon:<User size={14}/>},{k:'customerPhone',label:'Phone *',ph:'98XXX XXXXX',icon:<Phone size={14}/>}].map(fld=>(
              <div key={fld.k}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{fld.label}</label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{fld.icon}</span>
                  <input value={(form as any)[fld.k]} onChange={e=>set(fld.k,e.target.value)} placeholder={fld.ph}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Bike Number *</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Bike size={14}/></span>
                <input value={form.bikeNumber} onChange={e=>set('bikeNumber',e.target.value.toUpperCase())} placeholder="TN 01 AB 1234"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
              <select value={form.pickupType} onChange={e=>set('pickupType',e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {(['Breakdown','Emergency','Scheduled','Delivery'] as const).map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Issue Description *</label>
            <textarea value={form.issueDescription} onChange={e=>set('issueDescription',e.target.value)} placeholder="Describe the problem..." rows={3}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Google Maps Link</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><MapPin size={14}/></span>
              <input value={form.locationLink} onChange={e=>set('locationLink',e.target.value)} placeholder="Paste from WhatsApp..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Assign Staff (optional)</label>
            <select value={form.assignedEmployeeId} onChange={e=>set('assignedEmployeeId',e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— Unassigned (New) —</option>
              {staff.filter(s=>s.status!=='Offline').map(s=><option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
            <input value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any extra info..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Pickup'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const PickupManager: React.FC<Props> = ({ onNavigate }) => {
  const [tab, setTab] = useState<'pipeline'|'map'|'visitors'>('pipeline');
  const [pickups, setPickups] = useState<PickupRequest[]>(MOCK_PICKUPS);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stageFilter, setStageFilter] = useState<PickupStatus|null>(null);
  const [draggedId, setDraggedId] = useState<string|null>(null);
  const [dragOver, setDragOver] = useState<string|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [real, v] = await Promise.all([dbService.getPickupRequests(), dbService.getVisitors()]);
        if (real.length > 0) {
          setPickups(prev => {
            const realIds = new Set(real.map(p=>p.id));
            return [...real, ...prev.filter(p=>!realIds.has(p.id))];
          });
        }
        setVisitors(v);
      } catch(e) { console.error(e); }
    })();
  }, []);

  const handleMove = useCallback((id: string, toStatus: PickupStatus) => {
    setPickups(prev => prev.map(p => p.id===id ? {...p, status:toStatus, updatedAt:now()} : p));
    dbService.getPickupRequests().then(real => {
      const r = real.find(p=>p.id===id);
      if (r) dbService.updatePickupRequest({...r, status:toStatus});
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (!confirm('Delete this pickup?')) return;
    setPickups(prev => prev.filter(p=>p.id!==id));
    dbService.deletePickupRequest(id).catch(()=>{});
  }, []);

  const handleDrop = useCallback((toStatus: PickupStatus) => {
    if (draggedId) { handleMove(draggedId, toStatus); setDraggedId(null); }
  }, [draggedId, handleMove]);

  const handleNew = useCallback(async (formData: any) => {
    const emp = MOCK_STAFF.find(s=>s.id===formData.assignedEmployeeId);
    const p: PickupRequest = {
      id: `PU-${Date.now()}`, ...formData,
      status: formData.assignedEmployeeId ? 'Assigned' : 'New',
      assignedEmployeeName: emp?.name,
      createdAt: now(), updatedAt: now(),
    };
    setPickups(prev=>[p,...prev]);
    await dbService.addPickupRequest(p);
    setShowModal(false);
  }, []);

  // Filter logic
  const allStaff = [...new Set(pickups.map(p=>p.assignedEmployeeName).filter(Boolean))];
  const allTypes = [...new Set(pickups.map(p=>(p as any).pickupType).filter(Boolean))];

  const filtered = pickups.filter(p => {
    const q = search.toLowerCase();
    const ms = !q || p.customerName.toLowerCase().includes(q) || p.bikeNumber.toLowerCase().includes(q) || p.customerPhone.includes(q);
    const mst = !staffFilter || p.assignedEmployeeName === staffFilter;
    const mt = !typeFilter || (p as any).pickupType === typeFilter;
    const mf = !stageFilter || normalize(p.status) === stageFilter;
    return ms && mst && mt && mf;
  });

  const byStage = (key: PickupStatus) => filtered.filter(p => normalize(p.status) === key);
  const total = MOCK_STAFF.filter(s=>s.status!=='Offline').length;

  return (
    <div className="min-h-screen bg-slate-50 -mx-4 -mt-4 pt-0">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          {/* Row 1 */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={()=>onNavigate('more')} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-blue-400 transition-colors">
                <ArrowLeft size={13}/> BACK
              </button>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Admin Portal</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  <span className="text-xs font-semibold text-emerald-600">Live</span>
                  <span className="text-xs text-slate-400 ml-1">• {total} staff active · {pickups.filter(p=>normalize(p.status)!=='Completed'&&normalize(p.status)!=='Cancelled').length} open pickups</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">
                <Phone size={13}/> Share Link
              </button>
              <button onClick={()=>setShowModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                <Plus size={13}/> New Pickup
              </button>
              <button onClick={()=>onNavigate('field_service_manager')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors">
                <ExternalLink size={13}/> Live App
              </button>
            </div>
          </div>

          {/* Row 2 – tabs + search + filters */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {([['pipeline','Pickup Pipeline'],['map','Staff Map'],['visitors','Visitors']] as const).map(([key,label])=>(
                <button key={key} onClick={()=>setTab(key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${tab===key?'bg-white text-blue-600 shadow-sm':'text-slate-600 hover:text-slate-900'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-[280px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pickups..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"/>
            </div>

            {/* Filters */}
            <div className="relative">
              <button onClick={()=>{setStaffOpen(o=>!o);setTypeOpen(false)}}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700">
                <Users size={13}/> {staffFilter||'All Staff'} <ChevronDown size={12}/>
              </button>
              {staffOpen && (
                <div className="absolute top-10 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[140px]">
                  <button onClick={()=>{setStaffFilter('');setStaffOpen(false)}} className="w-full px-3 py-2 text-xs text-left hover:bg-slate-50 font-medium">All Staff</button>
                  {allStaff.map(s=>(
                    <button key={s} onClick={()=>{setStaffFilter(s!);setStaffOpen(false)}} className="w-full px-3 py-2 text-xs text-left hover:bg-slate-50">{s}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={()=>{setTypeOpen(o=>!o);setStaffOpen(false)}}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700">
                <Radio size={13}/> {typeFilter||'All Types'} <ChevronDown size={12}/>
              </button>
              {typeOpen && (
                <div className="absolute top-10 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[130px]">
                  <button onClick={()=>{setTypeFilter('');setTypeOpen(false)}} className="w-full px-3 py-2 text-xs text-left hover:bg-slate-50 font-medium">All Types</button>
                  {allTypes.map(t=>(
                    <button key={t} onClick={()=>{setTypeFilter(t!);setTypeOpen(false)}} className="w-full px-3 py-2 text-xs text-left hover:bg-slate-50">{t}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-screen-xl mx-auto px-4">
        {tab === 'pipeline' && (
          <>
            {/* Step tracker */}
            <div className="py-2 border-b border-slate-200 bg-white -mx-4 px-4 mb-4">
              <StepTracker pickups={pickups} activeFilter={stageFilter} onFilter={setStageFilter}/>
            </div>

            {/* Kanban */}
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar">
              {STAGES.map(stage => (
                <KanbanColumn key={stage.key} stage={stage}
                  pickups={byStage(stage.key)}
                  onMove={handleMove} onDelete={handleDelete}
                  onDragStart={setDraggedId} onDrop={handleDrop}
                  isOver={dragOver===stage.key} setOver={setDragOver}/>
              ))}
            </div>
          </>
        )}

        {tab === 'map' && (
          <div className="py-4">
            <StaffMap staff={MOCK_STAFF}/>
          </div>
        )}

        {tab === 'visitors' && (
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-800">Visitors Log</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">{visitors.length} total</span>
            </div>
            {visitors.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Eye size={40} className="mx-auto mb-3 opacity-30"/>
                <p className="font-semibold">No visitors recorded yet</p>
                <p className="text-sm mt-1">Visitors added from the Visitors page appear here</p>
              </div>
            ) : visitors.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-blue-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Phone size={10}/>{v.phone}</span>
                    <code className="font-mono font-bold">{v.bikeNumber}</code>
                  </div>
                  {v.remarks && <p className="text-xs text-slate-600 mt-1">{v.remarks}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{v.type}</span>
                  <div className="text-[10px] text-slate-400 mt-1">{timeAgo(v.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <NewPickupModal staff={MOCK_STAFF} onClose={()=>setShowModal(false)} onSave={handleNew}/>}
    </div>
  );
};

export default PickupManager;
