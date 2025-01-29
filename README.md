# Banano Wallet Adapter

A modern, easy-to-use wallet adapter for Banano applications built with React and Next.js. This adapter provides a seamless way to integrate Banano wallet functionality into your web applications.

## Features

- 🔒 **Secure Wallet Management**: Create, import, and manage Banano wallets securely
- 💸 **Transaction Handling**: Send and receive BANANO with ease
- 🔄 **Auto-receive Pending**: Automatically receive pending transactions
- 📊 **Transaction History**: View detailed transaction history
- 📱 **QR Code Generation**: Generate QR codes for wallet addresses
- 🎨 **Beautiful UI**: Modern, responsive design with customizable themes
- 🔌 **Easy Integration**: Simple React components and hooks
- 📱 **Mobile Responsive**: Works great on all devices

## Installation

```bash
npm install banano-wallet-adapter
# or
yarn add banano-wallet-adapter
```

## Quick Start

1. Wrap your app with the `BananoWalletProvider`:

```tsx
import { BananoWalletProvider } from 'banano-wallet-adapter';

function App() {
  return (
    <BananoWalletProvider>
      <YourApp />
    </BananoWalletProvider>
  );
}
```

2. Use the connect button component:

```tsx
import { BananoConnectButton } from 'banano-wallet-adapter';

function YourApp() {
  return (
    <BananoConnectButton 
      theme="black"     // Options: "black", "white", "blue", "yellow", "green"
      modalTheme="light" // Options: "light", "dark"
    />
  );
}
```

3. Access wallet functionality with the `useWallet` hook:

```tsx
import { useWallet } from 'banano-wallet-adapter';

function WalletInfo() {
  const { 
    address,
    balance,
    isConnected,
    connect,
    disconnect,
    sendBanano,
    receivePending,
    getTransactionHistory
  } = useWallet();

  // Example: Send BANANO
  const handleSend = async () => {
    try {
      const hash = await sendBanano('ban_address', '1.0');
      console.log('Transaction hash:', hash);
    } catch (error) {
      console.error('Error sending BANANO:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <>
          <p>Address: {address}</p>
          <p>Balance: {balance} BAN</p>
        </>
      ) : (
        <p>Wallet not connected</p>
      )}
    </div>
  );
}
```

## Components

### BananoConnectButton

A customizable button component that handles wallet connection:

```tsx
<BananoConnectButton 
  theme="black"      // Visual theme of the button
  modalTheme="light" // Theme for the connection modal
/>
```

### WalletDetails

A component that displays wallet information, QR code, and transaction history:

```tsx
import { WalletDetails } from 'banano-wallet-adapter';

function App() {
  return <WalletDetails />;
}
```

## Hook API

The `useWallet` hook provides access to the following wallet functionality:

```typescript
interface WalletContextType {
  // State
  address: string | null;
  balance: string;
  seed: string | null;
  pendingBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
  mnemonic: string;

  // Methods
  connect: (seedOrPrivateKey?: string) => Promise<void>;
  disconnect: () => void;
  generateNewWallet: () => Promise<{ mnemonic: string; address: string }>;
  sendBanano: (toAddress: string, amount: string) => Promise<string>;
  receivePending: () => Promise<string[]>;
  getTransactionHistory: () => Promise<Array<{
    type: 'send' | 'receive';
    account: string;
    amount: string;
    hash: string;
    timestamp: number;
  }>>;
}
```

## Styling

The components are built with Tailwind CSS and can be customized through themes and CSS classes. The default styling provides a clean, modern look that follows best practices for crypto wallet UIs.

## Security

- Seeds and private keys are never stored in localStorage
- All sensitive operations are performed client-side
- Uses the battle-tested Banani library for core wallet operations. [Thanks to prussia.dev!](https://github.com/stjet/banani)

## Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

## Contributing

Currently in progress...

## License

MIT License - feel free to use this in your projects!
