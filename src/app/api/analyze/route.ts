import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is missing');
  }
  return new OpenAI({ apiKey });
};

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes DX (Developer Experience) failure scenarios and generates structured information about them.'
        },
        {
          role: 'user',
          content: `Analyze this DX failure scenario and generate a JSON response with a title, summary, and relevant tags: ${input}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return NextResponse.json(
        { error: 'Failed to generate response from OpenAI' },
        { status: 500 }
      );
    }
    
    const parsedResponse = JSON.parse(responseContent);
    
    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json(
      { error: 'Failed to process the request' },
      { status: 500 }
    );
  }
}
