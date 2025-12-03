import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  onGeneratePaths: (userRequest: string, date: string) => void;
}

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export function ChatBot({ onGeneratePaths }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m your AI schedule assistant. Tell me what you\'d like to do and when, and I\'ll create optimized path suggestions for you on the UIUC campus.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) {
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Check if date is provided
    if (!selectedDate) {
      const noDateMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Please select a date for your schedule so I can generate the best path suggestions for you.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, noDateMessage]);
      setInputMessage('');
      return;
    }

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `Great! I'm generating 3 optimized path suggestions for ${selectedDate}. Each will include a campus map with routes and detailed schedule...`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    // Generate paths
    setTimeout(() => {
      onGeneratePaths(inputMessage, selectedDate);
      
      const successMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: '✅ Done! I\'ve generated 3 path options for you. Check them out on the right side - each has a detailed campus map and schedule breakdown.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, successMessage]);
    }, 500);

    setInputMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-700 to-slate-600">
        <h2 className="text-white flex items-center gap-2">
          <BotIcon />
          <span>AI Schedule Assistant</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1">Chat with AI to plan your day</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user' 
                ? 'bg-orange-500 text-white' 
                : 'bg-slate-600 text-white'
            }`}>
              {message.type === 'user' ? <UserIcon /> : <BotIcon />}
            </div>
            
            <div className={`flex-1 ${message.type === 'user' ? 'flex justify-end' : ''}`}>
              <div className={`inline-block max-w-[85%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-orange-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">
              📅 Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1.5">
              💬 Your Message
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Describe your schedule needs..."
                className="flex-1 h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="h-9 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
