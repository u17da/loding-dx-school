import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is missing');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(request: Request) {
  try {
    const { summary, title } = await request.json();
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Summary is required' },
        { status: 400 }
      );
    }
    
    const promptResponse = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'あなたはDX（開発者体験）の失敗事例から画像生成プロンプトを作成するアシスタントです。以下の情報から、DALL-Eで生成するための適切な画像プロンプトを作成してください。プロンプトは英語で、詳細かつ視覚的な要素を含み、プロフェッショナルな雰囲気のイラストになるようにしてください。'
        },
        {
          role: 'user',
          content: `以下のDX失敗事例から画像生成プロンプトを作成してください：
          タイトル: ${title || ''}
          概要: ${summary}`
        }
      ],
      functions: [
        {
          name: 'generate_image_prompt',
          description: 'Generate a detailed image prompt for DALL-E based on the DX failure case',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'A detailed image prompt in English for DALL-E to generate an illustration',
              }
            },
            required: ['prompt'],
          }
        }
      ],
      function_call: { name: 'generate_image_prompt' },
    });
    
    let imagePrompt = '';
    const promptMessage = promptResponse.choices[0].message;
    
    if (
      promptMessage.function_call &&
      promptMessage.function_call.name === 'generate_image_prompt'
    ) {
      try {
        const promptData = JSON.parse(promptMessage.function_call.arguments);
        imagePrompt = promptData.prompt;
      } catch (error) {
        console.error('Error parsing prompt function call arguments:', error);
        imagePrompt = `Create a professional illustration representing this developer experience failure: ${title || summary}. The image should be suitable for a technical audience.`;
      }
    } else {
      imagePrompt = `Create a professional illustration representing this developer experience failure: ${title || summary}. The image should be suitable for a technical audience.`;
    }
    
    try {
      const imageResponse = await getOpenAIClient().images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });
      
      if (!imageResponse || !imageResponse.data || imageResponse.data.length === 0) {
        throw new Error('No image data returned from DALL-E API');
      }
      
      const imageUrl = imageResponse.data[0].url;
      
      if (!imageUrl) {
        throw new Error('No image URL in DALL-E response');
      }
      
      return NextResponse.json({
        imageUrl,
        prompt: imagePrompt,
      });
    } catch (error) {
      console.error('Error in DALL-E image generation:', error);
      throw new Error(`DALL-E image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
