
// Fix: Added React import to resolve missing React namespace for types in ToolContext
import React from 'react';
import { Type, FunctionDeclaration } from '@google/genai';
import { MemoryItem } from '../types';

export const getTools = (): FunctionDeclaration[] => [
  {
    name: 'googleSearch',
    parameters: {
      type: Type.OBJECT,
      description: 'Perform a web search to find up-to-date information, news, or complex facts.',
      properties: {
        query: { type: Type.STRING, description: 'The search query string.' }
      },
      required: ['query']
    }
  },
  {
    name: 'getWeather',
    parameters: {
      type: Type.OBJECT,
      description: 'Get the current weather for a specific location.',
      properties: {
        location: { type: Type.STRING, description: 'The city and state/country.' }
      },
      required: ['location']
    }
  },
  {
    name: 'saveMemory',
    parameters: {
      type: Type.OBJECT,
      description: 'Save a piece of information to the long-term memory bank about the user or their preferences.',
      properties: {
        content: { type: Type.STRING, description: 'The fact or preference to remember.' },
        category: { 
          type: Type.STRING, 
          description: 'The category of memory.',
          enum: ['personal', 'preference', 'task', 'general']
        }
      },
      required: ['content', 'category']
    }
  },
  {
    name: 'getMemories',
    parameters: {
      type: Type.OBJECT,
      description: 'Retrieve stored information from memory banks.',
      properties: {
        category: { type: Type.STRING, description: 'Filter by category (optional).' }
      }
    }
  }
];

interface ToolContext {
  memories: MemoryItem[];
  // Fix: Dispatch and SetStateAction require the React namespace
  setMemories: React.Dispatch<React.SetStateAction<MemoryItem[]>>;
  setTranscriptions: React.Dispatch<React.SetStateAction<any[]>>;
}

export const handleToolCall = async (name: string, args: any, context: ToolContext) => {
  console.log(`JARVIS executing tool: ${name}`, args);

  switch (name) {
    case 'googleSearch':
      // Using placeholder results since we are simulation. 
      // In a real environment with direct API, the model handles grounding, 
      // but here we act as the tool executor.
      return {
        summary: `I've analyzed the latest data for "${args.query}". Sources indicate several significant developments in the field...`,
        sources: [
          { title: "Global Intelligence Report", url: "https://news.example.com/latest" },
          { title: "Technical Documentation", url: "https://docs.example.com/spec" }
        ]
      };

    case 'getWeather':
      const conditions = ['Clear skies', 'Partly cloudy', 'Light rain', 'Overcast'];
      const temp = Math.floor(Math.random() * 15) + 15;
      return {
        location: args.location,
        temperature: `${temp}°C`,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        humidity: '45%',
        wind: '12 km/h'
      };

    case 'saveMemory':
      const newMemory: MemoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        content: args.content,
        category: args.category || 'general'
      };
      context.setMemories(prev => [newMemory, ...prev]);
      return { status: 'success', message: 'Memory stored in neural banks, Sir.' };

    case 'getMemories':
      const filtered = args.category 
        ? context.memories.filter(m => m.category === args.category)
        : context.memories;
      return { 
        count: filtered.length, 
        items: filtered.slice(0, 5).map(m => m.content) 
      };

    default:
      return { error: 'Unknown system tool.' };
  }
};
