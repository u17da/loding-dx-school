'use client';

import React, { useState } from 'react';
import { ConversationState } from '@/types/conversationState';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type DebugInfo = {
  message?: string;
  conversationData?: Record<string, unknown>;
  conversationState?: ConversationState;
  complete?: boolean;
};

export default function TestSubmitPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [initialInput, setInitialInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.initial);
  const [currentInput, setCurrentInput] = useState('');
  const [debug, setDebug] = useState<DebugInfo>({});

  const startConversation = async () => {
    if (!initialInput.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: initialInput };
    setConversation([userMessage]);
    setInitialInput('');
    setIsLoading(true);
    setConversationState(ConversationState.gathering_details);
    
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage],
          conversationState: ConversationState.gathering_details,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }
      
      const data = await response.json();
      setDebug(data);
      
      if (data.message) {
        setConversation(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
      
      if (data.conversationState) {
        setConversationState(data.conversationState);
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      setConversation(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'すみません、エラーが発生しました。もう一度お試しください。' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!currentInput.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: currentInput };
    setConversation(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...conversation, userMessage],
          conversationState,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }
      
      const data = await response.json();
      setDebug(data);
      
      if (data.message) {
        setConversation(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
      
      if (data.conversationState) {
        setConversationState(data.conversationState);
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      setConversation(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'すみません、エラーが発生しました。もう一度お試しください。' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>テスト送信ページ</h1>
      
      {conversationState === ConversationState.initial ? (
        <div>
          <textarea
            value={initialInput}
            onChange={(e) => setInitialInput(e.target.value)}
            placeholder="DX失敗事例を入力してください"
            style={{ width: '100%', height: '200px', padding: '10px', marginBottom: '10px' }}
          />
          <button
            onClick={startConversation}
            disabled={!initialInput.trim() || isLoading}
            style={{ padding: '10px 20px', backgroundColor: '#3778c2', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            {isLoading ? '送信中...' : '送信して会話を始める'}
          </button>
        </div>
      ) : (
        <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px' }}>
          <div style={{ height: '300px', overflowY: 'auto', marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
            {conversation.map((message, index) => (
              <div 
                key={index} 
                style={{ 
                  textAlign: message.role === 'user' ? 'right' : 'left',
                  margin: '10px 0'
                }}
              >
                <div 
                  style={{ 
                    display: 'inline-block',
                    maxWidth: '80%',
                    padding: '10px',
                    borderRadius: '5px',
                    backgroundColor: message.role === 'user' ? '#3778c2' : 'white',
                    color: message.role === 'user' ? 'white' : 'black',
                    border: message.role === 'user' ? 'none' : '1px solid #ccc'
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="text-center p-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent">
                </div>
              </div>
            )}
          </div>
          
          <form onSubmit={sendMessage} style={{ display: 'flex' }}>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              disabled={isLoading}
              placeholder="メッセージを入力..."
              style={{ flex: 1, padding: '10px', marginRight: '10px' }}
            />
            
            <button
              type="submit"
              disabled={!currentInput.trim() || isLoading}
              style={{ padding: '10px 20px', backgroundColor: '#3778c2', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              送信
            </button>
          </form>
        </div>
      )}
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>デバッグ情報:</h3>
        <pre>{JSON.stringify(debug, null, 2)}</pre>
        <p>現在の会話状態: {conversationState}</p>
      </div>
    </div>
  );
}
