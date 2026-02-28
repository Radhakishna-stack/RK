import React, { useMemo } from 'react';
import { FieldServiceJob, Salesman, FieldJobStatus } from '../types';
import { Card } from './ui/Card';
import { Trophy, Clock, Target, AlertCircle } from 'lucide-react';

interface MechanicPerformanceDashboardProps {
    mechanics: Salesman[];
    jobs: FieldServiceJob[];
}

interface PerformanceStats {
    mechanicId: string;
    mechanicName: string;
    jobsCompleted: number;
    totalEstimatedMins: number;
    totalActualMins: number;
    efficiencyScore: number; // Formula: (Estimated / Actual) * 100
}

const MechanicPerformanceDashboard: React.FC<MechanicPerformanceDashboardProps> = ({ mechanics, jobs }) => {

    const stats = useMemo(() => {
        const perfMap = new Map<string, PerformanceStats>();

        // Initialize map for all mechanics
        mechanics.forEach(m => {
            perfMap.set(m.id, {
                mechanicId: m.id,
                mechanicName: m.name,
                jobsCompleted: 0,
                totalEstimatedMins: 0,
                totalActualMins: 0,
                efficiencyScore: 0
            });
        });

        // Calculate stats based on completed jobs
        jobs.forEach(job => {
            if (job.status === FieldJobStatus.COMPLETED && job.assignedTo && perfMap.has(job.assignedTo)) {
                const stat = perfMap.get(job.assignedTo)!;

                // Only count jobs that have BOTH estimated and actual durations for fairness
                if (job.estimatedDurationMinutes && job.actualDurationMinutes) {
                    stat.jobsCompleted += 1;
                    stat.totalEstimatedMins += job.estimatedDurationMinutes;
                    stat.totalActualMins += job.actualDurationMinutes;
                }
            }
        });

        // Finalize efficiency scores
        return Array.from(perfMap.values())
            .map(stat => {
                if (stat.jobsCompleted > 0 && stat.totalActualMins > 0) {
                    // Score = (Target Time / Actual Time) * 100
                    // E.g. Target=60m, Actual=45m -> (60/45)*100 = 133% (Highly efficient)
                    stat.efficiencyScore = Math.round((stat.totalEstimatedMins / stat.totalActualMins) * 100);
                }
                return stat;
            })
            // Sort by efficiency (highest first), then by jobs completed
            .sort((a, b) => b.efficiencyScore - a.efficiencyScore || b.jobsCompleted - a.jobsCompleted);

    }, [mechanics, jobs]);

    const getScoreColor = (score: number) => {
        if (score === 0) return 'text-slate-400 bg-slate-100'; // No data
        if (score >= 100) return 'text-green-700 bg-green-100 border-green-200'; // Beating estimates
        if (score >= 85) return 'text-blue-700 bg-blue-100 border-blue-200'; // Solid pace
        return 'text-red-700 bg-red-100 border-red-200'; // Struggling
    };

    return (
        <Card className="flex flex-col h-full bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Mechanic Performance Leaderboard
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Based on Estimated vs Actual completion times</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <th className="font-semibold p-4">Rank</th>
                            <th className="font-semibold p-4">Mechanic</th>
                            <th className="font-semibold p-4 text-center">Jobs<br />Completed</th>
                            <th className="font-semibold p-4 text-center">Avg Est.<br />Time</th>
                            <th className="font-semibold p-4 text-center">Avg Act.<br />Time</th>
                            <th className="font-semibold p-4 text-right">Efficiency<br />Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stats.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500">
                                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    No performance data available yet.
                                </td>
                            </tr>
                        ) : (
                            stats.map((stat, index) => {
                                const avgEst = stat.jobsCompleted ? Math.round(stat.totalEstimatedMins / stat.jobsCompleted) : 0;
                                const avgAct = stat.jobsCompleted ? Math.round(stat.totalActualMins / stat.jobsCompleted) : 0;

                                return (
                                    <tr key={stat.mechanicId} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 align-middle">
                                            {index === 0 && stat.jobsCompleted > 0 ? (
                                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                                                    1st
                                                </div>
                                            ) : index === 1 && stat.jobsCompleted > 0 ? (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                                                    2nd
                                                </div>
                                            ) : index === 2 && stat.jobsCompleted > 0 ? (
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm">
                                                    3rd
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 font-medium flex items-center justify-center text-sm border border-slate-200">
                                                    {index + 1}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-semibold text-slate-900">{stat.mechanicName}</div>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded bg-slate-100 text-slate-700 font-semibold">
                                                {stat.jobsCompleted}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            {avgEst > 0 ? (
                                                <div className="flex items-center justify-center gap-1 text-slate-600">
                                                    <Target className="w-3.5 h-3.5" />
                                                    {avgEst}m
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            {avgAct > 0 ? (
                                                <div className="flex items-center justify-center gap-1 text-slate-900 font-medium">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {avgAct}m
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {stat.jobsCompleted > 0 ? (
                                                <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold text-sm border ${getScoreColor(stat.efficiencyScore)}`}>
                                                    {stat.efficiencyScore}%
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">No data</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default MechanicPerformanceDashboard;
