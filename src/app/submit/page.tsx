'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

interface Case {
  title: string;
  summary: string;
  tags: string[];
  image_url: string;
}

export default function SubmitPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCase, setGeneratedCase] = useState<Case | null>(null);
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input');

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // Note: In production, you should use server-side API calls
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('Please enter a description of the DX failure scenario.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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
      if (!responseContent) throw new Error('Failed to generate response from OpenAI');
      
      const parsedResponse = JSON.parse(responseContent);
      
      const imagePrompt = `Create an illustration representing this developer experience failure scenario: ${parsedResponse.title}. The image should be professional and suitable for a technical audience.`;
      
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
      });

      const imageUrl = imageResponse.data?.[0]?.url;
      if (!imageUrl) throw new Error('Failed to generate image');

      const newCase: Case = {
        title: parsedResponse.title,
        summary: parsedResponse.summary,
        tags: parsedResponse.tags,
        image_url: imageUrl,
      };

      setGeneratedCase(newCase);
      setStep('review');
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!generatedCase) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('cases')
        .insert([generatedCase]);
      
      if (error) throw error;
      
      setStep('success');
    } catch (err) {
      console.error('Error saving to Supabase:', err);
      setError('Failed to save your submission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setGeneratedCase(null);
    setStep('input');
    setError('');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Submit a DX Failure Scenario</h1>
      
      {step === 'input' && (
        <div className="max-w-2xl mx-auto">
          <p className="mb-6 text-gray-600">
            Describe a developer experience (DX) failure scenario you've encountered. Our AI will analyze it and generate a structured case.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-1">
                DX Failure Scenario
              </label>
              <textarea
                id="scenario"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the DX failure scenario in detail..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Generate Case'}
            </button>
          </form>
        </div>
      )}
      
      {step === 'review' && generatedCase && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4">{generatedCase.title}</h2>
            
            <div className="mb-6">
              <img 
                src={generatedCase.image_url} 
                alt={generatedCase.title}
                className="w-full h-64 object-cover rounded-md mb-4"
              />
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-gray-700">{generatedCase.summary}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {generatedCase.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
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
          
          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Start Over
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      )}
      
      {step === 'success' && (
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-100 text-green-800 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
            <p>Your DX failure scenario has been submitted successfully.</p>
          </div>
          
          <button
            onClick={handleReset}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit Another Case
          </button>
        </div>
      )}
    </div>
  );
}
