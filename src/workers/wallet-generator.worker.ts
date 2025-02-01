import { Wallet, RPC } from 'banani';

const ctx: Worker = self as any;

type MatchType = 'prefix' | 'suffix' | 'anywhere' | 'either';

interface GenerateMessage {
  pattern: string;
  matchType: MatchType;
  rpcUrl: string;
}

ctx.addEventListener('message', (event: MessageEvent<GenerateMessage>) => {
  const { pattern, matchType, rpcUrl } = event.data;
  const rpc = new RPC(rpcUrl);

  while (true) {
    const { seed, address } = Wallet.gen_random_wallet(rpc);
    
    // Extract the part after ban_1 or ban_3
    const addressWithoutPrefix = address.slice(5); // Skip "ban_1" or "ban_3"
    const patternLower = pattern.toLowerCase();
    const addressLower = addressWithoutPrefix.toLowerCase();
    
    const matches = matchType === 'prefix' 
      ? addressLower.startsWith(patternLower)
      : matchType === 'suffix'
      ? addressLower.endsWith(patternLower)
      : matchType === 'either'
      ? addressLower.startsWith(patternLower) || addressLower.endsWith(patternLower)
      : addressLower.includes(patternLower);

    if (matches) {
      ctx.postMessage({ type: 'success', seed, address });
      break;
    }
    
    // Report progress
    ctx.postMessage({ type: 'progress' });
  }
});
