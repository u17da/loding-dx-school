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
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const determineNextQuestion = (conversationData: ConversationData): string => {
  if (!conversationData.summary) {
    return 'どのような失敗だったのか教えてください。';
  } else if (!conversationData.when) {
    return 'その失敗はいつ頃起きましたか？';
  } else if (!conversationData.location) {
    return 'どこでその失敗が発生しましたか？';
  } else if (!conversationData.who) {
    return '具体的にどなたが関係していましたか？';
  } else if (!conversationData.impact) {
    return '結果的にどうなりましたか？授業や活動にどんな影響がありましたか？';
  } else if (!conversationData.cause) {
    return 'その原因や、問題が起きた理由は何だったと思いますか？';
  } else if (!conversationData.suggestions) {
    return 'あなたの考える改善方法や、「こうすればよかった」というアドバイスを教えてください。';
  } else {
    return '情報が揃いました。以下の内容で送信してよろしいですか？\n\n' +
      `いつ: ${conversationData.when}\n` +
      `どこで: ${conversationData.location}\n` +
      `誰が: ${conversationData.who}\n` +
      `何が起きたか: ${conversationData.summary}\n` +
      `どうなったか: ${conversationData.impact}\n` +
      `原因: ${conversationData.cause}\n` +
      `改善方法・アドバイス: ${conversationData.suggestions}`;
  }
};

const isConversationComplete = (conversationData: ConversationData): boolean => {
  return !!(
    conversationData.summary &&
    conversationData.when &&
    conversationData.location &&
    conversationData.who &&
    conversationData.impact &&
    conversationData.cause &&
    conversationData.suggestions
  );
};

export async function POST(request: Request) {
  try {
    const { messages, conversationData } = await request.json();
    
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
              description: 'When the failure occurred',
            },
            location: {
              type: 'string',
              description: 'Where the failure occurred',
            },
            who: {
              type: 'string',
              description: 'Who was involved in the failure',
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
    
    let currentField = '';
    if (!currentData.summary) currentField = 'summary';
    else if (!currentData.when) currentField = 'when';
    else if (!currentData.location) currentField = 'location';
    else if (!currentData.who) currentField = 'who';
    else if (!currentData.impact) currentField = 'impact';
    else if (!currentData.cause) currentField = 'cause';
    else if (!currentData.suggestions) currentField = 'suggestions';
    
    const systemMessage = {
      role: 'system',
      content: `あなたはDX（開発者体験）の失敗事例を収集するアシスタントです。ユーザーとの会話から情報を抽出し、構造化されたデータを作成してください。現在は「${currentField}」の情報を収集しています。ユーザーの回答から適切な情報を抽出し、function callingを使用して情報を返してください。簡潔に応答し、次の質問に自然につなげてください。`
    };
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...messages],
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
    
    const nextQuestion = determineNextQuestion(updatedData);
    const isComplete = isConversationComplete(updatedData);
    
    if (isComplete && !updatedData.tags) {
      try {
        const tagsResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'あなたはDX（開発者体験）の失敗事例からタグと簡潔なタイトルを生成するアシスタントです。以下の情報から、関連するタグ（5つまで）と簡潔なタイトルを生成してください。タグは「ネットワーク」「端末管理」「セキュリティ」「開発環境」「コミュニケーション」「ツール」「プロセス」などの分類を使用してください。'
            },
            {
              role: 'user',
              content: `以下のDX失敗事例からタグとタイトルを生成してください：
              いつ: ${updatedData.when}
              どこで: ${updatedData.location}
              誰が: ${updatedData.who}
              何が起きたか: ${updatedData.summary}
              どうなったか: ${updatedData.impact}
              原因: ${updatedData.cause}
              改善方法・アドバイス: ${updatedData.suggestions}`
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
    
    return NextResponse.json({
      message: nextQuestion,
      conversationData: updatedData,
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
