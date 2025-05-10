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
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content text is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    const moderationResponse = await openai.moderations.create({
      input: content,
    });

    if (!moderationResponse.results || moderationResponse.results.length === 0) {
      return NextResponse.json(
        { error: 'Failed to get moderation results from OpenAI' },
        { status: 500 }
      );
    }

    const result = moderationResponse.results[0];
    const isFlagged = result.flagged;
    
    return NextResponse.json({
      flagged: isFlagged,
      categories: result.categories,
      category_scores: result.category_scores,
      result
    });
  } catch (error) {
    console.error('Error in moderation API:', error);
    return NextResponse.json(
      { error: 'Failed to process the moderation request' },
      { status: 500 }
    );
  }
}
