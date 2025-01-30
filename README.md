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
- `styles/*`: Custom styling and themes
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
│       └── details.tsx      # Wallet details example
├── lib/                     # Core libraries
│   └── banano-wallet-adapter/ # Wallet adapter
│       ├── context.tsx      # Wallet context
│       ├── index.ts         # Main exports
│       └── types.ts         # TypeScript types
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
import { useBananoWallet } from "@/lib/banano-wallet-adapter";

export function WalletInfo() {
  const { wallet, connected } = useBananoWallet();
  // ... use wallet state
}
```

## 🎨 Customization

### 1. Themes
The template comes with several pre-built themes:
- Black (Default)
- White
- Blue
- Yellow
- Green

Customize the connect button:
```tsx
<BananoConnectButton 
  theme="black"      // Choose your theme
  modalTheme="light" // Light or dark modal
/>
```

### 2. Components
Each component is designed to be easily customized:

```tsx
// components/wallet/details.tsx
export function WalletDetails({ 
  showQR = true,         // Toggle QR code
  showHistory = true,    // Toggle transaction history
  maxHistory = 10        // Number of transactions to show
}) {
  // Your customizations here
}
```

### 3. Styling
The template uses Tailwind CSS with custom theme extensions:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      }
    }
  }
}
```

## 🔒 Security Best Practices

1. **Environment Variables**
```env
# .env.local
NEXT_PUBLIC_RPC_URL=https://kaliumapi.appditto.com/api
```

2. **Wallet Security**
- Seeds and private keys are never stored
- All operations are client-side
- Uses [Banani](https://github.com/stjet/banani) for core operations

## 📦 Core Features

- ✅ Wallet Connection
  - Create new wallet
  - Import from seed/mnemonic
  - Auto-disconnect protection
- ✅ Transactions
  - Send BANANO
  - Receive pending
  - Transaction history
- ✅ UI Components
  - Connect button
  - Wallet details
  - QR code generation
- ✅ Developer Experience
  - TypeScript support
  - Detailed error handling
  - Comprehensive hooks

## 🛠 Development Tools

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run typecheck
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Banani Documentation](https://banani.prussia.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

Currently in progress...

## 📄 License

MIT License - feel free to use this in your projects!
