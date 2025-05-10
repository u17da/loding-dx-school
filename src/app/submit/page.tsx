'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';
import ConversationUI from '@/components/ConversationUI';

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
  const [imageGenerating, setImageGenerating] = useState(false);

  const handleConversationComplete = async (data: ConversationData, messages: Message[]) => {
    setConversationData(data);
    setConversation(messages);
    setImageGenerating(true);
    
    try {
      const imageResponse = await fetch('/api/generate-image-from-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          summary: data.summary,
          title: data.title
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
      setImageGenerating(false);
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
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">DX失敗事例の投稿</h1>
      
      {step === 'conversation' && (
        <div className="max-w-2xl mx-auto">
          <p className="mb-6 text-text">
            開発者体験（DX）の失敗事例について、AIアシスタントとの会話形式で情報を入力してください。
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-4 h-[500px] flex flex-col">
            <ConversationUI 
              onComplete={handleConversationComplete} 
              isLoading={imageGenerating}
            />
          </div>
          
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
