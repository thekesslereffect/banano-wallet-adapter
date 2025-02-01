'use client';

import React from 'react';
import { TokenGate } from './TokenGate';

export function TokenGateExample() {
  return (
    <div className="w-full space-y-4">
      <h2 className="text-lg font-medium">Token Gate Example</h2>
      
      {/* Simple TokenGate */}
      <TokenGate minimumBalance="100">
        <div className="rounded-xl bg-blue-500 p-4">
          <h3 className="text-lg font-medium text-white mb-2">
            Premium Content
          </h3>
          <p className="text-white">
            This content is only visible to users who hold at least 100 BAN!
          </p>
        </div>
      </TokenGate>

      {/* TokenGate with Fallback */}
      <TokenGate 
        minimumBalance="1000"
        fallback={
          <div className="rounded-xl bg-black p-4">
            <p className="text-white">
              🔒 Hold 1000 BAN to unlock exclusive VIP content!
            </p>
          </div>
        }
      >
        <div className="rounded-xl bg-purple-500 p-4">
          <h3 className="text-lg font-medium text-white mb-2">
            VIP Content
          </h3>
          <p className="text-white">
            Welcome VIP! This is exclusive content for our biggest BANANO holders.
          </p>
        </div>
      </TokenGate>
    </div>
  );
}
