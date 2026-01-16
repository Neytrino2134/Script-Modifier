
export interface VideoEntry {
    id: string;
    thumbnailBase64: string | null;
    uploadDate: string; // ISO string
    title: string;
    description?: string;
    views?: number;
    likes?: number;
    isShort?: boolean;
}

export interface DailyStat {
    date: string; // YYYY-MM-DD
    subscribers: number;
    totalViews: number; // Aggregate
    shortsViews?: number;
    longViews?: number;
}

export interface DailyNote {
    id: string;
    date: string; // YYYY-MM-DD or ISO
    content: string;
}

export interface ChannelData {
    id: string;
    name: string;
    description?: string;
    videos: VideoEntry[];
    stats: DailyStat[];
    goal?: string;
    currentSubscribers?: number;
    isMonetized?: boolean;
}

export interface GlobalGoal {
    id: string;
    title: string;
    color: string;
    startDate: string;
    endDate: string;
    habits: string[]; // List of daily sub-tasks/habits strings
}

export interface AnalyticsData {
    authorName: string;
    channels: ChannelData[];
    activeChannelId: string | null;
    globalNotes: DailyNote[]; 
    aiAdvice: string;
    aiSuggestedGoal?: string;
    targetLanguage?: string;
    contextPrompt?: string;
    // Planning Data
    schedule?: Record<string, any[]>;
    activePlanningChannels?: string[];
    // Discipline & Motivation Data
    disciplinePoints?: number;
    globalGoals?: GlobalGoal[];
    habitCompletions?: Record<string, Record<string, boolean>>; // date -> { goalId-habitIdx: true }
}
