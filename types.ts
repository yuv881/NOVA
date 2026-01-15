
export interface MemoryItem {
  id: string;
  timestamp: number;
  content: string;
  category: 'personal' | 'preference' | 'task' | 'general';
}

export interface ToolCallState {
  name: string;
  args: any;
  status: 'pending' | 'executing' | 'completed' | 'error';
  result?: any;
}

export interface TranscriptionItem {
  speaker: 'user' | 'jarvis';
  text: string;
  timestamp: number;
}
