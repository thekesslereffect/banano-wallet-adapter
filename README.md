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
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── BananoConnectButton.tsx  # Wallet connect button
│   └── examples/            # Example components
│       ├── details.tsx      # Wallet details example
│       └── TransactionHistory.tsx # Transaction history component
├── lib/                     # Core libraries
│   └── banano-wallet-adapter/ # Wallet adapter
│       ├── BananoWalletProvider.tsx # Main wallet provider
│       ├── SecureStorage.tsx # Secure storage implementation
│       ├── SeedManager.tsx  # Seed management
│       └── index.ts         # Main exports
└── providers/               # App providers
    └── Providers.tsx        # Client-side providers wrapper
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

### User Experience
- Loading states for all operations
- Error feedback and handling
- Automatic balance refresh
- Transaction history with timestamps
- Clean and modern UI components

### Security
- Client-side encryption
- No seed transmission
- Secure storage implementation
- Password-based key derivation

## 🎨 Customization

### Styling
The template uses Tailwind CSS for styling. You can customize the look and feel by:
1. Modifying `tailwind.config.js`
2. Editing component classes
3. Adding your own CSS in `globals.css`

### Configuration
You can customize the wallet behavior by modifying:
1. RPC endpoint in `BananoWalletProvider.tsx`
2. Auto-refresh intervals for balance and transactions
3. UI components in the `components` directory

## 📚 API Reference

### useWallet Hook
```typescript
const {
  address,          // Current wallet address
  balance,          // Current balance in BANANO
  isConnected,      // Connection status
  isLoadingBalance, // Balance loading state
  connect,          // Connect wallet function
  disconnect,       // Disconnect wallet function
  sendBanano,       // Send BANANO function
  getTransactionHistory, // Get transaction history
} = useWallet();
```

### Components
1. `BananoConnectButton`: Main wallet connection button
2. `TransactionHistory`: Transaction history display
3. `WalletDetails`: Wallet information display

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
