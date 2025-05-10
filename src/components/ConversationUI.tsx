'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ConversationData = {
  when?: string;
  location?: string;
  who?: string;
  summary?: string;
  impact?: string;
  cause?: string;
  suggestions?: string;
  tags?: string[];
  image_url?: string;
  title?: string;
};

interface ConversationUIProps {
  onComplete: (data: ConversationData, conversation: Message[]) => void;
  isLoading?: boolean;
}

export default function ConversationUI({ onComplete, isLoading = false }: ConversationUIProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'どのような失敗だったのか教えてください。' },
  ]);
  const [input, setInput] = useState('');
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const [conversationComplete, setConversationComplete] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim() || localLoading || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLocalLoading(true);
    
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }
      
      const data = await response.json();
      
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
      
      if (data.conversationData) {
        setConversationData(data.conversationData);
      }
      
      if (data.complete) {
        setConversationComplete(true);
        onComplete(data.conversationData, [...messages, userMessage, { role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'すみません、エラーが発生しました。もう一度お試しください。' 
        }
      ]);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-white border border-gray-200 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {(localLoading || isLoading) && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-200 rounded-tl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={localLoading || isLoading || conversationComplete}
          placeholder={conversationComplete ? "会話が完了しました" : "メッセージを入力..."}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || localLoading || isLoading || conversationComplete}
          className="bg-primary text-white p-2 rounded-lg disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  );
}
