import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ConversationState } from '@/types/conversationState';

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
  paragraph_summary?: string;
};

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is missing');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

const getConversationStage = (messages: Array<{role: string, content: string}>): ConversationState => {
  const messageCount = messages.filter(m => m.role === 'user').length;
  
  if (messageCount === 1) return ConversationState.gathering_details;
  if (messageCount <= 3) return ConversationState.gathering_details;
  if (messageCount <= 9) return ConversationState.seeking_suggestions;
  return ConversationState.summarizing;
};

const isConversationComplete = (messages: Array<{role: string, content: string}>, conversationData: ConversationData): boolean => {
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const hasKeyInfo = !!(conversationData.summary && conversationData.impact);
  const hasSuggestions = !!conversationData.suggestions;
  
  if (userMessageCount >= 3 && hasKeyInfo && hasSuggestions) {
    return true;
  }
  
  return userMessageCount >= 5 && hasKeyInfo;
};

const generateParagraphSummary = async (messages: Array<{role: 'user' | 'assistant', content: string}>): Promise<string> => {
  try {
    const apiMessages = [
      {
        role: 'system' as const,
        content: `あなたはDX（開発者体験）の失敗事例を自然な文章にまとめるアシスタントです。
        会話の内容から、以下の情報を含む自然な段落を作成してください：
        - 失敗の概要
        - いつ、どこで、誰が関わったか（もし言及されていれば）
        - どのような影響があったか
        - 原因や理由
        - 改善方法や提案
        
        自然で読みやすい日本語の段落として、これらの情報を有機的につなげてください。
        箇条書きではなく、流れるような文章にしてください。`
      },
      ...messages
    ];
    
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages
    });
    
    return response.choices[0].message.content || '要約を生成できませんでした。';
  } catch (error) {
    console.error('Error generating paragraph summary:', error);
    return '要約の生成中にエラーが発生しました。';
  }
};

export async function POST(request: Request) {
  try {
    const { messages, conversationData, conversationState } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }
    
    const currentData: ConversationData = conversationData || {};
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid request: last message must be from user' },
        { status: 400 }
      );
    }
    
    const stage = conversationState || getConversationStage(messages);
    
    const functions = [
      {
        name: 'extract_conversation_data',
        description: 'Extract structured data from the conversation',
        parameters: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'A summary of what happened in the DX failure scenario',
            },
            when: {
              type: 'string',
              description: 'When the failure occurred (if mentioned)',
            },
            location: {
              type: 'string',
              description: 'Where the failure occurred (if mentioned)',
            },
            who: {
              type: 'string',
              description: 'Who was involved in the failure (if mentioned)',
            },
            impact: {
              type: 'string',
              description: 'The impact or result of the failure',
            },
            cause: {
              type: 'string',
              description: 'The root cause or reason for the failure',
            },
            suggestions: {
              type: 'string',
              description: 'Suggestions for improvement or advice',
            },
          },
          required: [],
        },
      },
    ];
    
    const systemMessage = {
      role: 'system',
      content: `あなたはDX（開発者体験）の失敗事例を収集する共感的なアシスタントです。
      
      現在の会話ステージ: ${stage}
      
      以下のガイドラインに従って会話を進めてください：
      
      - 自然で共感的な会話を心がけ、質問攻めにならないようにしてください
      - ユーザーの感情に寄り添い、「それは大変でしたね」「なるほど」などの共感的な言葉を使ってください
      - 会話の流れに合わせて、自然に情報を引き出してください
      - 「いつ」「どこで」「誰が」などの情報は、会話の中で自然に出てきた場合のみ抽出してください
      - 最終的には改善方法や「こうすればよかった」というアドバイスを聞くようにしてください
      
      ユーザーの回答から適切な情報を抽出し、function callingを使用して情報を返してください。
      次の質問は自然な流れで、前の回答に関連させて行ってください。`
    };
    
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        systemMessage,
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      functions,
      function_call: { name: 'extract_conversation_data' },
    });
    
    const assistantMessage = response.choices[0].message;
    let extractedData = {};
    
    if (
      assistantMessage.function_call &&
      assistantMessage.function_call.name === 'extract_conversation_data'
    ) {
      try {
        extractedData = JSON.parse(assistantMessage.function_call.arguments);
      } catch (error) {
        console.error('Error parsing function call arguments:', error);
      }
    }
    
    const updatedData = { ...currentData, ...extractedData };
    
    const isComplete = isConversationComplete(messages, updatedData);
    
    if (isComplete && !updatedData.paragraph_summary) {
      const transitionMessage = '共有、ありがとうございます。それでは事例の生成に入ります。少々お待ちください。';
      
      updatedData.paragraph_summary = await generateParagraphSummary(messages);
      
      if (!updatedData.tags) {
        try {
          const tagsResponse = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'あなたはDX（開発者体験）の失敗事例からタグと簡潔なタイトルを生成するアシスタントです。以下の情報から、関連するタグ（5つまで）と簡潔なタイトルを生成してください。タグは「ネットワーク」「端末管理」「セキュリティ」「開発環境」「コミュニケーション」「ツール」「プロセス」などの分類を使用してください。'
              },
              {
                role: 'user',
                content: `以下のDX失敗事例からタグとタイトルを生成してください：\n\n${updatedData.paragraph_summary}`
              }
            ],
            functions: [
              {
                name: 'generate_tags_and_title',
                description: 'Generate tags and title for the DX failure case',
                parameters: {
                  type: 'object',
                  properties: {
                    tags: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'Tags related to the DX failure case (max 5)',
                    },
                    title: {
                      type: 'string',
                      description: 'A concise title for the DX failure case',
                    }
                  },
                  required: ['tags', 'title'],
                }
              }
            ],
            function_call: { name: 'generate_tags_and_title' },
          });
          
          const tagsMessage = tagsResponse.choices[0].message;
          
          if (
            tagsMessage.function_call &&
            tagsMessage.function_call.name === 'generate_tags_and_title'
          ) {
            try {
              const tagsData = JSON.parse(tagsMessage.function_call.arguments);
              updatedData.tags = tagsData.tags;
              updatedData.title = tagsData.title;
            } catch (error) {
              console.error('Error parsing tags function call arguments:', error);
            }
          }
        } catch (error) {
          console.error('Error generating tags:', error);
        }
      }
      
      const nextMessage = `${transitionMessage}\n\n情報が揃いました。以下の内容で送信してよろしいですか？\n\n${updatedData.paragraph_summary}`;
      
      const state = typeof conversationState === 'string' 
        ? conversationState as ConversationState 
        : ConversationState.summarizing;
          
      return NextResponse.json({
        message: nextMessage,
        conversationData: updatedData,
        conversationState: state,
        complete: true,
      });
    }
    
    let assistantResponseMessage = assistantMessage.content;
    
    let nextStage = stage;
    
    const shouldCompleteConversation = isConversationComplete(messages, updatedData);
    
    if (shouldCompleteConversation) {
      assistantResponseMessage = '共有、ありがとうございます。それでは事例の生成に入ります。少々お待ちください。';
      
      nextStage = ConversationState.summarizing;
      
      return NextResponse.json({
        message: assistantResponseMessage,
        conversationData: updatedData,
        conversationState: nextStage,
        complete: true,
      });
    }
    
    if (!assistantResponseMessage && assistantMessage.function_call) {
      try {
        let followUpPrompt = '';
        const empathyPhrases = [
          'それは大変でしたね。',
          'なるほど、理解できます。',
          'その状況は確かに難しいですね。',
          'ご苦労されたのですね。',
          'その経験は貴重ですね。'
        ];
        
        const randomEmpathy = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
        
        let nextStage = stage;
        
        if (stage === ConversationState.gathering_details) {
          if (!updatedData.summary) {
            followUpPrompt = '失敗事例についてもう少し詳しく教えていただけますか？';
          } else if (!updatedData.impact) {
            followUpPrompt = 'その問題によって、どのような影響がありましたか？開発チームや製品にどのような支障が出ましたか？';
          } else if (!updatedData.cause) {
            followUpPrompt = 'その問題の根本的な原因は何だったと思いますか？';
          } else {
            followUpPrompt = 'この経験から学んだことや、今後同じ問題を防ぐためのアドバイスはありますか？';
            nextStage = ConversationState.seeking_suggestions;
          }
        } else if (stage === ConversationState.seeking_suggestions) {
          if (!updatedData.suggestions) {
            followUpPrompt = 'この経験から学んだことや、今後同じ問題を防ぐためのアドバイスはありますか？';
          } else {
            assistantResponseMessage = '共有、ありがとうございます。それでは事例の生成に入ります。少々お待ちください。';
            nextStage = ConversationState.summarizing;
            
            return NextResponse.json({
              message: assistantResponseMessage,
              conversationData: updatedData,
              conversationState: nextStage,
              complete: true,
            });
          }
        }
        
        const followUpResponse = await getOpenAIClient().chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `あなたはDX（開発者体験）の失敗事例を収集する共感的なアシスタントです。
              ユーザーの話を聞き、共感しながら自然な会話を続けてください。
              以下の情報が既に収集されています：
              ${JSON.stringify(updatedData, null, 2)}
              
              次の質問をするときは、上記の情報を踏まえて、自然な流れで質問してください。
              必ず共感的な言葉を含め、機械的にならないようにしてください。
              例：「それは大変でしたね」「なるほど、理解できます」など
              
              共感フレーズ: ${randomEmpathy}
              提案するフォローアップ質問: ${followUpPrompt}
              
              共感フレーズとフォローアップ質問を自然につなげた応答を生成してください。`
            },
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ]
        });
        
        assistantResponseMessage = followUpResponse.choices[0].message.content || `${randomEmpathy} ${followUpPrompt}`;
      } catch (error) {
        console.error('Error generating follow-up response:', error);
        assistantResponseMessage = '申し訳ありません、もう少し詳しく教えていただけますか？';
      }
    }
    
    const state = typeof conversationState === 'string' 
      ? conversationState as ConversationState 
      : nextStage;
        
    return NextResponse.json({
      message: assistantResponseMessage || '会話を続けるために、もう少し詳しく教えていただけますか？',
      conversationData: updatedData,
      conversationState: state,
      complete: isComplete,
    });
  } catch (error) {
    console.error('Error in conversation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
