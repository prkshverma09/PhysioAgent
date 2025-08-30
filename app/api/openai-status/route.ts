import { NextResponse } from 'next/server';

export async function GET() {
  const isAvailable = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    isAvailable,
    message: isAvailable 
      ? 'OpenAI API is available' 
      : 'OpenAI API key not found'
  });
}
