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
          content: `あなたはDX（開発者体験）の失敗事例から画像生成プロンプトを作成するアシスタントです。
          以下の情報から、DALL-Eで生成するための適切な画像プロンプトを作成してください。
          
          【重要な要件】
          - プロンプトは英語で作成してください
          - 画像は「アニメ調」のスタイルで作成してください
          - 登場人物は「日本人の教師」を想定してください
          - 学校の教室やコンピュータ室などの教育現場を背景にしてください
          - 技術的な問題や失敗を視覚的に表現してください
          - 明るく親しみやすいアニメスタイルを使用してください
          
          プロンプトの最後に必ず以下の指示を含めてください：
          "Anime style, Japanese teacher, school setting, bright colors, friendly character design"`
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
        imagePrompt = `Create an anime-style illustration of a Japanese teacher experiencing this developer experience failure: ${title || summary}. The image should be in a school setting with bright colors and friendly character design. Anime style, Japanese teacher, school setting, bright colors, friendly character design.`;
      }
    } else {
      imagePrompt = `Create an anime-style illustration of a Japanese teacher experiencing this developer experience failure: ${title || summary}. The image should be in a school setting with bright colors and friendly character design. Anime style, Japanese teacher, school setting, bright colors, friendly character design.`;
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
