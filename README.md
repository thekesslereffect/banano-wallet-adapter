# Banano Wallet Adapter Template

![Banano Wallet Adapter](https://github.com/thekesslereffect/banano-wallet-adapter/blob/master/public/docs/Hero.png)

A modern, production-ready starter template for building Banano applications with React and Next.js. This template provides everything you need to start building a Banano-enabled web application.

## 🚀 Getting Started

1. Use this template:
```bash
# Clone the repository
git clone https://github.com/your-username/banano-wallet-adapter
cd banano-wallet-adapter

# Install dependencies
npm install

# Start the development server
npm run dev
```

2. Start customizing:
- `app/page.tsx`: Main landing page
- `components/*`: React components
- `lib/banano-wallet-adapter/*`: Core wallet functionality

## 📁 Project Structure

```
banano-wallet-adapter/
├── public/                    # Static files
│   └── docs/                 # Documentation assets
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes
│   │   │   ├── coinflip/    # Coinflip game API endpoint
│   │   │   ├── crash/       # Crash game API endpoint
│   │   │   └── faucet/      # Faucet API endpoint
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── examples/        # Example implementations
│   │   │   ├── Balance.tsx         # Balance display
│   │   │   ├── BananoQR.tsx        # QR code generator
│   │   │   ├── CoinFlip.tsx        # Coin flip game
│   │   │   ├── CrashGame.tsx       # Crash game
│   │   │   ├── Faucet.tsx          # Banano faucet
│   │   │   ├── Send.tsx            # Send BANANO form
│   │   │   ├── TipJar.tsx          # Tip jar component
│   │   │   └── TransactionHistory.tsx  # Transaction list
│   │   ├── BananoConnectButton.tsx # Wallet connection UI
│   │   └── ExamplesShowcase.tsx    # Interactive component showcase
│   ├── lib/                 # Core library code
│   │   └── banano-wallet-adapter/  # Main wallet implementation
│   │       ├── BananoWalletProvider.tsx  # Wallet context provider
│   │       ├── SecureStorage.tsx         # Secure storage implementation
│   │       ├── SeedManager.tsx           # Seed management
│   │       └── index.ts                  # Public API exports
│   └── providers/           # React context providers
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🔧 Implementation

### Setting up the Provider

1. The wallet provider is implemented as a client component in `providers/Providers.tsx`:
```tsx
'use client';
import { BananoWalletProvider } from "@/lib/banano-wallet-adapter";

export function Providers({ children }) {
  return <BananoWalletProvider>{children}</BananoWalletProvider>;
}
```

2. Wrap your app in `layout.tsx`:
```tsx
import { Providers } from "@/providers/Providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Using the Wallet

1. Import and use the connect button:
```tsx
import { BananoConnectButton } from "@/components/BananoConnectButton";

export default function YourComponent() {
  return <BananoConnectButton />;
}
```

2. Access wallet context in client components:
```tsx
'use client';
import { useWallet } from "@/lib/banano-wallet-adapter";

export function WalletInfo() {
  const { address, balance, isConnected } = useWallet();
  // ... use wallet state
}
```

## 🎮 Example Components

The template includes several example components to demonstrate wallet integration:

### Core Functionality
- **Balance**: Display wallet balance with auto-refresh
- **BananoQR**: Generate QR codes for wallet addresses
- **Send**: Send BANANO to other addresses
- **TransactionHistory**: View transaction history

### Games and Interactive Features
- **CoinFlip**: Simple betting game with 50/50 odds
- **CrashGame**: Multiplayer crash-style betting game
- **TipJar**: Accept tips from other users
- **Faucet**: Distribute free BANANO to users

All example components are showcased in an interactive selector interface, making it easy to explore different wallet functionalities.

## 🌟 Features

### Secure Wallet Management
- Encrypted seed storage
- Password-based encryption
- Secure key derivation
- Automatic wallet reconnection

### Balance Management
- Real-time balance updates
- Automatic pending transaction detection
- Efficient balance refresh mechanism
- Loading states for better UX

### Transaction Handling
- Send and receive BANANO
- Transaction history with live updates
- Pending transaction detection
- Error handling and validation
- Support for both RAW and BANANO units

### Banano Name Service (BNS)
- Resolve BNS names to addresses
- Reverse lookup of addresses to BNS names
- Support for multiple TLDs (.ban, .mictest, .jtv)
- Efficient caching of resolved names
- Send to BNS addresses (e.g., name.ban)

### User Experience
- Loading states for all operations
- Error feedback and handling
- Automatic balance refresh
- Transaction history with timestamps
- Clean and modern UI components
- Interactive component showcase

## 🎨 Customization

### Styling
The template uses Tailwind CSS for styling. You can customize the look and feel by:
1. Modifying `tailwind.config.ts`
2. Editing component classes
3. Adding your own CSS in `globals.css`

### Configuration
You can customize the wallet behavior by modifying:
1. RPC endpoint in `BananoWalletProvider.tsx`
2. Auto-refresh intervals for balance and transactions
3. UI components in the `components` directory
4. Game and faucet settings in their respective API routes

## 📚 API Reference

### useWallet Hook
```typescript
const {
  address,          // Current wallet address
  balance,          // Current balance in BANANO
  bnsName,          // BNS name if available
  isConnected,      // Connection status
  isConnecting,     // Connection in progress
  resolveBNS,       // Resolve BNS name to address
  connect,          // Connect wallet function
  disconnect,       // Disconnect wallet function
  generateNewWallet, // Generate new wallet
} = useWallet();
```

### BNS Resolution
```typescript
// Resolve a BNS name to an address
const address = await resolveBNS('name', 'ban'); // Returns ban_ address or null

// Send to BNS address
const { wallet } = useWallet();
await wallet.send('name.ban', '1.23');
```

### Components
1. `BananoConnectButton`: Main wallet connection button
2. `ExamplesShowcase`: Interactive component selector
3. Various example components for games and wallet features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
