import React, { useState, useEffect, useRef } from 'react';
import { Agent, Message } from '../types';
import { Send } from 'lucide-react';

interface ChatInterfaceProps {
  agent: Agent;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      sender: 'agent',
      text: `Protocol initiated. I am ${agent.name}. How can I assist with your ${(agent.category || '').toLowerCase().replace('_', ' ')} needs today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `Processing ${agent.category} request...`,
        "I've identified a pattern match in the data stream.",
        "Compiling output based on your parameters.",
        "Optimization complete. Efficiency increased.",
        "Executing requested subroutine."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: randomResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[400px] bg-cyber-dark/50 rounded-lg border border-cyber-dim overflow-hidden">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyber-dim scrollbar-track-transparent">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] px-4 py-2 rounded-lg text-sm font-mono leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-[var(--agent-color)]/10 text-[var(--agent-color)] border border-[var(--agent-color)]/30 rounded-br-none' 
                  : 'bg-cyber-panel text-gray-300 border border-cyber-dim rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-cyber-panel border border-cyber-dim px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[var(--agent-color)] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[var(--agent-color)] rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-[var(--agent-color)] rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-cyber-panel border-t border-cyber-dim flex items-center gap-2">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Message ${agent.name}...`}
          className="flex-1 bg-cyber-black border border-cyber-dim rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--agent-color)] font-mono transition-colors"
        />
        <button 
          onClick={handleSend}
          className="p-2 bg-[var(--agent-color)]/10 hover:bg-[var(--agent-color)]/20 text-[var(--agent-color)] border border-[var(--agent-color)]/50 rounded transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};