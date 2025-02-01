'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';
import { RPC } from 'banani';
import * as bip39 from 'bip39';

type MatchType = 'prefix' | 'suffix' | 'anywhere' | 'either';

interface GeneratedWallet {
  address: string;
  seed: string;
  mnemonic: string;
}

export function CustomWalletGenerator() {
  const [pattern, setPattern] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('prefix');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [generatedWallet, setGeneratedWallet] = useState<GeneratedWallet | null>(null);
  const { connect } = useWallet();
  const shouldContinue = useRef(true);
  const workerRef = useRef<Worker | null>(null);

  const stopGeneration = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    shouldContinue.current = false;
    setIsGenerating(false);
  }, []);

  const getEstimatedAttempts = useCallback((length: number, type: MatchType) => {
    // Base32 has 32 possible characters
    if (type === 'anywhere') {
      // For 'anywhere', it's more likely to find a match since it can be anywhere in the string
      // We'll estimate it's about 4x more likely than prefix/suffix
      return Math.pow(32, length) / 4;
    } else if (type === 'either') {
      // For 'either', it's roughly twice as likely as a single prefix/suffix match
      // since we're checking both positions
      return Math.pow(32, length) / 2;
    }
    // For prefix and suffix, it's 1/32^length
    return Math.pow(32, length);
  }, []);

  const getEstimatedTimeString = useCallback((attemptsPerSecond: number, totalAttempts: number) => {
    const seconds = totalAttempts / attemptsPerSecond;
    if (seconds < 60) {
      return `~${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `~${Math.round(seconds / 60)} minutes`;
    } else if (seconds < 86400) {
      return `~${Math.round(seconds / 3600)} hours`;
    } else {
      return `~${Math.round(seconds / 86400)} days`;
    }
  }, []);

  const getCurrentSpeed = useCallback(() => {
    if (!startTime || !attempts) return 0;
    const elapsedTime = Date.now() - startTime;
    return attempts / (elapsedTime / 1000);
  }, [startTime, attempts]);

  const getEstimatedTime = useCallback(() => {
    if (!startTime || !attempts) return 'Calculating...';
    const attemptsPerSecond = getCurrentSpeed();
    return `${Math.round(attemptsPerSecond)} addresses/second`;
  }, [startTime, attempts, getCurrentSpeed]);

  const getTimeEstimate = useCallback(() => {
    if (!pattern) return '';
    
    const estimatedAttempts = getEstimatedAttempts(pattern.length, matchType);
    const currentSpeed = getCurrentSpeed();
    
    if (isGenerating && currentSpeed > 0) {
      // Use actual speed if we're generating
      return getEstimatedTimeString(currentSpeed, estimatedAttempts);
    } else {
      // Use a conservative estimate of 10,000 attempts/second when not generating
      return getEstimatedTimeString(10000, estimatedAttempts);
    }
  }, [pattern, matchType, isGenerating, getCurrentSpeed, getEstimatedAttempts, getEstimatedTimeString]);

  const generateWallet = useCallback(async () => {
    if (!pattern) return;
    
    setIsGenerating(true);
    setStartTime(Date.now());
    setAttempts(0);
    setGeneratedWallet(null);
    shouldContinue.current = true;

    // Create a new worker
    const worker = new Worker(new URL('@/workers/wallet-generator.worker.ts', import.meta.url));
    workerRef.current = worker;

    let attempts = 0;
    let lastProgressUpdate = Date.now();

    worker.addEventListener('message', async (event) => {
      const { type, seed, address } = event.data;

      if (type === 'progress') {
        attempts++;
        
        // Update progress every 100ms
        if (Date.now() - lastProgressUpdate > 100) {
          setAttempts(attempts);
          lastProgressUpdate = Date.now();
        }
      } else if (type === 'success') {
        // Convert the seed to mnemonic for better user experience
        const mnemonic = bip39.entropyToMnemonic(seed.toLowerCase());
        
        setGeneratedWallet({
          address,
          seed,
          mnemonic
        });
        setIsGenerating(false);
        
        // Connect the wallet automatically
        try {
          await connect(seed);
        } catch (error) {
          console.error('Error connecting wallet:', error);
        }

        // Clean up worker
        worker.terminate();
        workerRef.current = null;
      }
    });

    // Start the worker
    worker.postMessage({
      pattern,
      matchType,
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://kaliumapi.appditto.com/api'
    });
  }, [pattern, matchType, connect]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      shouldContinue.current = false;
    };
  }, []);

  const getMatchTypeDescription = useCallback(() => {
    switch (matchType) {
      case 'prefix':
        return 'Pattern will appear right after "ban_1" or "ban_3"';
      case 'suffix':
        return 'Pattern will appear at the end of the address';
      case 'either':
        return 'Pattern will appear either right after "ban_1"/"ban_3" OR at the end of the address';
      case 'anywhere':
        return 'Pattern can appear anywhere after "ban_1" or "ban_3"';
    }
  }, [matchType]);

  const getExampleAddress = useCallback(() => {
    if (!pattern) return '';
    switch (matchType) {
      case 'prefix':
        return `ban_1${pattern}...`;
      case 'suffix':
        return `ban_1...${pattern}`;
      case 'either':
        return `ban_1${pattern}... OR ban_1...${pattern}`;
      case 'anywhere':
        return `ban_1...${pattern}...`;
    }
  }, [pattern, matchType]);

  return (
    <div className="w-full mx-auto space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Custom Wallet Generator</h2>
        <p className="text-gray-500 text-sm">
          Generate a Banano wallet with a custom address pattern. The address will start with "ban_1" or "ban_3".
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Pattern Type
          </label>
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as MatchType)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
            disabled={isGenerating}
          >
            <option value="prefix">Prefix (start with)</option>
            <option value="suffix">Suffix (end with)</option>
            <option value="either">Either Prefix or Suffix</option>
            <option value="anywhere">Anywhere in address</option>
          </select>
          <p className="text-xs text-gray-500">
            {getMatchTypeDescription()}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Pattern
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value.toLowerCase())}
              placeholder="Enter pattern (e.g. 'cool')"
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-1">
            {pattern && (
              <>
                <p className="text-xs text-gray-500">
                  Example: {getExampleAddress()}
                </p>
                <p className="text-xs text-gray-500">
                  Estimated time to find: {getTimeEstimate()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={generateWallet}
          disabled={!pattern || isGenerating}
          className={`w-full py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50 
            ${isGenerating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-black hover:bg-zinc-800'
            }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Wallet'}
        </button>

        {isGenerating && (
          <button
            onClick={stopGeneration}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Stop
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2">
          <p className="text-sm text-gray-600">
            Attempts: {attempts.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Speed: {getEstimatedTime()}
          </p>
          <p className="text-sm text-gray-600">
            Estimated time remaining: {getTimeEstimate()}
          </p>
        </div>
      )}

      {generatedWallet && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Generated Wallet</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Address:</span>
              <br />
              <span className="break-all font-mono">{generatedWallet.address}</span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Seed:</span>
              <br />
              <span className="break-all font-mono">{generatedWallet.seed}</span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Recovery Phrase:</span>
              <br />
              <span className="break-all font-mono">{generatedWallet.mnemonic}</span>
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Generated in {attempts.toLocaleString()} attempts
          </p>
        </div>
      )}
    </div>
  );
}
