import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

type ConversationState = 
  | 'waiting_for_initial_submission'
  | 'asking_for_additional_details'
  | 'asking_for_suggestions'
  | 'conversation_completed';

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is missing');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

const hasAdviceOrSuggestion = (message: string): boolean => {
  const adviceKeywords = [
    'すればよかった', 'しておけば', 'べきだった', 'した方が', 'するべき',
    'してほしい', 'してくれたら', 'してほしかった', 'すれば', 'するといい',
    '改善', 'アドバイス', '提案', '次回は', '今後は'
  ];
  
  return adviceKeywords.some(keyword => message.includes(keyword));
};

const getNextConversationState = (
  currentState: ConversationState,
  messages: Array<{role: string, content: string}>,
  conversationData: ConversationData
): { nextState: ConversationState; shouldComplete: boolean } => {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  
  switch (currentState) {
    case 'waiting_for_initial_submission':
      return { 
        nextState: 'asking_for_additional_details',
        shouldComplete: false
      };
      
    case 'asking_for_additional_details':
      if (hasAdviceOrSuggestion(lastUserMessage)) {
        return { 
          nextState: 'conversation_completed',
          shouldComplete: true
        };
      }
      
      if (messages.filter(m => m.role === 'user').length >= 3) {
        return { 
          nextState: 'asking_for_suggestions',
          shouldComplete: false
        };
      }
      
      return { 
        nextState: 'asking_for_additional_details',
        shouldComplete: false
      };
      
    case 'asking_for_suggestions':
      if (hasAdviceOrSuggestion(lastUserMessage)) {
        return { 
          nextState: 'conversation_completed',
          shouldComplete: true
        };
      }
      
      return { 
        nextState: 'asking_for_suggestions',
        shouldComplete: false
      };
      
    case 'conversation_completed':
      return { 
        nextState: 'conversation_completed',
        shouldComplete: true
      };
      
    default:
      return { 
        nextState: 'asking_for_additional_details',
        shouldComplete: false
      };
  }
};

const getSystemPromptForState = (state: ConversationState, messages: Array<{role: string, content: string}>): string => {
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const isFirstMessage = userMessageCount <= 1;
  
  switch (state) {
    case 'waiting_for_initial_submission':
      return `あなたはDX（開発者体験）の失敗事例を収集する共感的なアシスタントです。
      
      ユーザーが初めて失敗事例を入力したところです。まずは共感的な応答をして、ユーザーが安心して話せる雰囲気を作ってください。
      例えば「それは大変でしたね」「なるほど、そういう状況だったんですね」などの言葉を使ってください。
      
      その後、自然な流れで追加の詳細を聞いてください。ただし、質問攻めにならないよう注意してください。
      会話を通じて以下の情報を自然に引き出せるとよいですが、強制的に聞き出す必要はありません：
      - 失敗の概要
      - いつ、どこで、誰が関わったか（もし自然に出てくれば）
      - どのような影響があったか
      - 原因や理由
      
      ユーザーの回答から適切な情報を抽出し、function callingを使用して情報を返してください。`;
      
    case 'asking_for_additional_details':
      return `あなたはDX（開発者体験）の失敗事例を収集する共感的なアシスタントです。
      
      ${isFirstMessage ? '初めての応答では、まず共感を示し、ユーザーが安心して話せる雰囲気を作ってください。' : '引き続き共感的な態度で会話を進めてください。'}
      
      自然な流れで会話を続け、ユーザーの話に寄り添いながら、さりげなく詳細を引き出してください。
      質問攻めにならないよう、一度に複数の質問をしないでください。
      
      会話を通じて以下の情報を自然に引き出せるとよいですが、強制的に聞き出す必要はありません：
      - 失敗の概要や状況の詳細
      - どのような影響があったか
      - 原因や理由
      
      ユーザーの回答から適切な情報を抽出し、function callingを使用して情報を返してください。`;
      
    case 'asking_for_suggestions':
      return `あなたはDX（開発者体験）の失敗事例を収集する共感的なアシスタントです。
      
      これまでの会話で失敗事例についての基本的な情報が集まりました。
      ここで、ユーザーに「こうすればよかった」「こうしておいてくれたら」といった改善案やアドバイスを聞いてみてください。
      
      例えば以下のような質問が適切です：
      「この経験から、次回はどうすればよいと思いますか？」
      「こうしておけばよかったことや、改善したほうがいいと感じたことを教えてもらえますか？」
      「同じような状況になった人へのアドバイスがあれば教えてください」
      
      ユーザーの回答から適切な情報を抽出し、function callingを使用して情報を返してください。`;
      
    case 'conversation_completed':
      return `あなたはDX（開発者体験）の失敗事例を収集する共感的なアシスタントです。
      
      会話が完了しました。ユーザーに感謝の言葉を伝え、情報が揃ったことを伝えてください。
      例えば「ありがとうございます！それではいただいた情報でローディングDX事例を生成してみます！」などのメッセージが適切です。
      
      ユーザーの回答から適切な情報を抽出し、function callingを使用して情報を返してください。`;
      
    default:
      return `あなたはDX（開発者体験）の失敗事例を収集する共感的なアシスタントです。
      
      自然な会話を心がけ、ユーザーの感情に寄り添いながら情報を引き出してください。
      
      ユーザーの回答から適切な情報を抽出し、function callingを使用して情報を返してください。`;
  }
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
        箇条書きではなく、流れるような文章にしてください。
        
        重要：情報が不足している場合でも、無理に推測せず、会話から得られた情報のみを使用してください。`
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
    const { messages, conversationData, conversationState = 'waiting_for_initial_submission' } = await request.json();
    
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
    
    const { nextState, shouldComplete } = getNextConversationState(
      conversationState as ConversationState,
      messages,
      currentData
    );
    
    const systemPrompt = getSystemPromptForState(nextState, messages);
    
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
    
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
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
    
    if (shouldComplete && !updatedData.paragraph_summary) {
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
      
      const nextMessage = `情報が揃いました。以下の内容で送信してよろしいですか？\n\n${updatedData.paragraph_summary}`;
      
      return NextResponse.json({
        message: nextMessage,
        conversationData: updatedData,
        nextState,
        complete: true,
      });
    }
    
    return NextResponse.json({
      message: assistantMessage.content || '会話を続けましょう。',
      conversationData: updatedData,
      nextState,
      complete: shouldComplete,
    });
  } catch (error) {
    console.error('Error in conversation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
