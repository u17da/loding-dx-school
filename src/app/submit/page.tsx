'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';
import { ConversationState } from '@/types/conversationState';

interface ConversationData {
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
  paragraph_summary?: string;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function SubmitPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [step, setStep] = useState<'conversation' | 'review' | 'success'>('conversation');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [moderationFailed, setModerationFailed] = useState(false);
  const [moderationMessage, setModerationMessage] = useState('');
  const [initialInput, setInitialInput] = useState('');
  const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.initial);
  const [currentInput, setCurrentInput] = useState('');
  const [assistantTyping, setAssistantTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Note: imageGenerating variable has been removed to fix ESLint error

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

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
      
      if (data.message) {
        setConversation(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
      
      if (data.conversationData) {
        setConversationData(data.conversationData);
      }
      
      if (data.conversationState) {
        setConversationState(data.conversationState);
      }
      
      if (data.complete) {
        handleConversationComplete(data.conversationData, [...conversation, userMessage, { role: 'assistant', content: data.message }]);
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
    
    if (!currentInput.trim() || isLoading || conversationState === ConversationState.summarizing) return;
    
    const userMessage: Message = { role: 'user', content: currentInput };
    setConversation(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsLoading(true);
    setAssistantTyping(true);
    
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...conversation, userMessage],
          conversationData,
          conversationState,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }
      
      const data = await response.json();
      
      if (data.message) {
        setConversation(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
      
      if (data.conversationData) {
        setConversationData(data.conversationData);
      }
      
      if (data.conversationState) {
        setConversationState(data.conversationState);
      }
      
      if (data.complete) {
        handleConversationComplete(data.conversationData, [...conversation, userMessage, { role: 'assistant', content: data.message }]);
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
      setAssistantTyping(false);
    }
  };

  const handleConversationComplete = async (data: ConversationData, messages: Message[]) => {
    setConversationData(data);
    setConversation(messages);
    setIsLoading(true);
    
    try {
      const imageResponse = await fetch('/api/generate-image-from-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          summary: data.summary,
          title: data.title,
          useGptImage: true
        }),
      });
      
      if (!imageResponse.ok) {
        throw new Error('Failed to generate image');
      }
      
      const { imageUrl } = await imageResponse.json();
      if (!imageUrl) throw new Error('Failed to generate image');

      setConversationData(prev => ({
        ...prev,
        image_url: imageUrl
      }));
      
      setStep('review');
    } catch (err) {
      console.error('Error generating image:', err);
      setError('画像の生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!conversationData) return;
    
    setIsLoading(true);
    setModerationFailed(false);
    setModerationMessage('');
    
    try {
      const moderationResponse = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: conversationData.paragraph_summary || conversationData.summary }),
      });
      
      if (!moderationResponse.ok) {
        throw new Error('Failed to check content moderation');
      }
      
      const moderationResult = await moderationResponse.json();
      
      if (moderationResult.flagged) {
        console.log('Content flagged by moderation:', moderationResult);
        
        const supabase = getSupabase();
        await supabase
          .from('moderation_logs')
          .insert([{
            content: conversationData.summary,
            moderation_result: moderationResult
          }]);
        
        setModerationFailed(true);
        setModerationMessage('申し訳ありませんが、投稿内容がガイドラインに違反している可能性があります。内容を見直して再度お試しください。');
        return;
      }
      
      const supabaseCase = {
        title: conversationData.title,
        summary: conversationData.paragraph_summary || conversationData.summary,
        tags: JSON.stringify(conversationData.tags || []),
        image_url: conversationData.image_url,
        when: conversationData.when,
        location: conversationData.location,
        who: conversationData.who,
        impact: conversationData.impact,
        cause: conversationData.cause,
        suggestions: conversationData.suggestions,
        conversation: JSON.stringify(conversation),
        paragraph_summary: conversationData.paragraph_summary
      };
      
      console.log('Submitting to Supabase:', supabaseCase);
      
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('cases')
        .insert([supabaseCase])
        .select();
      
      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Successfully saved to Supabase:', data);
      setStep('success');
    } catch (err) {
      console.error('Error saving to Supabase:', err);
      setError(`送信に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setConversationData(null);
    setConversation([]);
    setStep('conversation');
    setError('');
    setModerationFailed(false);
    setModerationMessage('');
    setInitialInput('');
    setCurrentInput('');
    setConversationState(ConversationState.initial);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4 text-center text-primary">ローディングDX（しくじり）事例を共有してください！</h1>
      
      {step === 'conversation' && (
        <div className="max-w-2xl mx-auto">
          <p className="mb-6 text-text">
            あなたの『これは失敗だった…。』という事例をざっくりで良いので教えてください。内容を深掘りさせていただき、こちらでタイトルや画像などを生成しちゃいます。
          </p>
          
          {conversationState === ConversationState.initial ? (
            <div className="mb-6">
              <textarea
                value={initialInput}
                onChange={(e) => setInitialInput(e.target.value)}
                placeholder="どんな時に・どんなしくじりをしてしまったのか記載してください（例：プログラミングの授業でScratchを使おうとして自宅で教材研究をしていたのですが、いざ学校で試してみるとそもそも学校ではフィルタリングの制限でScratchにアクセスできなかった。教材研究の数時間が無駄になってしまった…。）"
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                disabled={isLoading}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={startConversation}
                  disabled={!initialInput.trim() || isLoading}
                  className="btn disabled:opacity-50"
                >
                  {isLoading ? '送信中...' : '送信して会話を始める'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-4 h-[500px] flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {conversation.map((message, index) => (
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
                {assistantTyping && (
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
              
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  disabled={isLoading || conversationState === ConversationState.summarizing}
                  placeholder={conversationState === ConversationState.summarizing ? "会話が完了しました" : "メッセージを入力..."}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!currentInput.trim() || isLoading || conversationState === ConversationState.summarizing}
                  className="bg-primary text-white p-2 rounded-lg disabled:opacity-50"
                >
                  送信
                </button>
              </form>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-sm mt-4">{error}</div>
          )}
        </div>
      )}
      
      {step === 'review' && conversationData && (
        <div className="max-w-2xl mx-auto">
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4 text-primary">{conversationData.title}</h2>
            
            {conversationData.image_url && (
              <div className="mb-6 relative h-64 w-full">
                <Image 
                  src={conversationData.image_url} 
                  alt={conversationData.title || ''}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-text whitespace-pre-wrap leading-relaxed">
                {conversationData.paragraph_summary || conversationData.summary}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">タグ</h3>
              <div className="flex flex-wrap gap-2">
                {conversationData.tags && conversationData.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="tag"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          {moderationFailed && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="font-medium">コンテンツモデレーションに失敗しました</p>
              <p className="text-sm">{moderationMessage}</p>
            </div>
          )}
          
          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-text py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              最初からやり直す
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 btn disabled:opacity-50"
            >
              {isLoading ? '保存中...' : '確認して送信'}
            </button>
          </div>
        </div>
      )}
      
      {step === 'success' && (
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-accent bg-opacity-20 text-primary p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">送信完了！</h2>
            <p>DX失敗事例が正常に送信されました。</p>
          </div>
          
          <button
            onClick={handleReset}
            className="btn"
          >
            別の事例を投稿する
          </button>
        </div>
      )}
    </div>
  );
}
