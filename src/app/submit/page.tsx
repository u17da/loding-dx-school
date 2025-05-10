'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('Please enter a description of the DX failure scenario.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });
      
      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze the scenario');
      }
      
      const parsedResponse = await analyzeResponse.json();
      
      const imagePrompt = `Create an illustration representing this developer experience failure scenario: ${parsedResponse.title}. The image should be professional and suitable for a technical audience.`;
      
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      
      if (!imageResponse.ok) {
        throw new Error('Failed to generate image');
      }
      
      const { imageUrl } = await imageResponse.json();
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
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Submit a DX Failure Scenario</h1>
      
      {step === 'input' && (
        <div className="max-w-2xl mx-auto">
          <p className="mb-6 text-text">
            Describe a developer experience (DX) failure scenario you&apos;ve encountered. Our AI will analyze it and generate a structured case.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="scenario" className="block text-sm font-medium text-text mb-1">
                DX Failure Scenario
              </label>
              <textarea
                id="scenario"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
              className="btn w-full disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Generate Case'}
            </button>
          </form>
        </div>
      )}
      
      {step === 'review' && generatedCase && (
        <div className="max-w-2xl mx-auto">
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4 text-primary">{generatedCase.title}</h2>
            
            <div className="mb-6 relative h-64 w-full">
              <Image 
                src={generatedCase.image_url} 
                alt={generatedCase.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover rounded-lg"
              />
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-primary">Summary</h3>
              <p className="text-text">{generatedCase.summary}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {generatedCase.tags.map((tag, index) => (
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
          
          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-text py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Start Over
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 btn disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      )}
      
      {step === 'success' && (
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-accent bg-opacity-20 text-primary p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
            <p>Your DX failure scenario has been submitted successfully.</p>
          </div>
          
          <button
            onClick={handleReset}
            className="btn"
          >
            Submit Another Case
          </button>
        </div>
      )}
    </div>
  );
}
