
import React from 'react';
import { DailyStat, VideoEntry } from './types';

// Simple SVG Line Chart
export const StatsChart: React.FC<{ stats: DailyStat[], videos: VideoEntry[], showSubs: boolean, showViews: boolean, showVideos: boolean }> = ({ stats, videos, showSubs, showViews, showVideos }) => {
    if (!stats.length && !videos.length) return <div className="h-24 flex items-center justify-center text-gray-500 text-xs">No data for chart</div>;

    // 1. Unify Dates
    const allDates = new Set<string>();
    stats.forEach(s => allDates.add(s.date));
    videos.forEach(v => allDates.add(v.uploadDate.split('T')[0]));
    
    const sortedDates = Array.from(allDates).sort();
    if (sortedDates.length < 2) return <div className="h-24 flex items-center justify-center text-gray-500 text-xs">Not enough data points</div>;

    // 2. Prepare Data Series
    const chartData = sortedDates.map(date => {
        const stat = stats.find(s => s.date === date);
        const time = new Date(date).getTime();
        const videoCount = videos.filter(v => v.uploadDate.split('T')[0] <= date).length;
        
        return {
            date,
            time,
            subscribers: stat ? stat.subscribers : undefined,
            totalViews: stat ? stat.totalViews : undefined,
            videoCount
        };
    });

    // 3. Scales
    const minTime = chartData[0].time;
    const maxTime = chartData[chartData.length - 1].time;
    const timeRange = maxTime - minTime || 1;

    // Normalize values to 0-1 for drawing
    const getPoints = (key: 'subscribers' | 'totalViews' | 'videoCount') => {
        const validPoints = chartData.filter(d => d[key] !== undefined);
        if (validPoints.length === 0) return [];
        
        const values = validPoints.map(d => d[key] as number);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1; // Avoid divide by zero

        return validPoints.map(d => ({
            x: ((d.time - minTime) / timeRange) * 100,
            y: 100 - (((d[key] as number) - minVal) / range) * 100, // Invert Y
            val: d[key],
            date: d.date
        }));
    };

    const subsPoints = showSubs ? getPoints('subscribers') : [];
    const viewsPoints = showViews ? getPoints('totalViews') : [];
    const videosPoints = showVideos ? getPoints('videoCount') : [];

    const renderLine = (points: any[], color: string) => {
        if (points.length < 2) return null;
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
            <>
                <path d={pathD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} stroke="none" vectorEffect="non-scaling-stroke">
                        <title>{`${p.date}: ${p.val}`}</title>
                    </circle>
                ))}
            </>
        );
    };

    return (
        <svg viewBox="0 0 100 100" className="w-full h-24 bg-gray-900/30 rounded border border-gray-700 overflow-visible" preserveAspectRatio="none">
            {renderLine(subsPoints, '#10b981')} {/* Emerald - Subs */}
            {renderLine(viewsPoints, '#06b6d4')} {/* Cyan - Views */}
            {renderLine(videosPoints, '#a855f7')} {/* Purple - Videos */}
        </svg>
    );
};
