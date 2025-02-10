'use client';

import React from 'react';
import { type ThemeName, type ModalThemeName, buttonThemes, modalThemes } from './BananoConnectButton';

interface ThemeSelectorProps {
  selectedButtonTheme: ThemeName;
  selectedModalTheme: ModalThemeName;
  onButtonThemeChange: (theme: ThemeName) => void;
  onModalThemeChange: (theme: ModalThemeName) => void;
}

export function ThemeSelector({
  selectedButtonTheme,
  selectedModalTheme,
  onButtonThemeChange,
  onModalThemeChange,
}: ThemeSelectorProps) {
  const buttonThemeColors: Record<ThemeName, string> = {
    black: 'bg-black',
    white: 'bg-white',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <label className="text-sm font-medium text-zinc-500">Button Theme</label>
        <div className="flex gap-3">
          {Object.keys(buttonThemes).map((themeName) => (
            <button
              key={themeName}
              onClick={() => onButtonThemeChange(themeName as ThemeName)}
              className={`
                w-8 h-8 rounded-full transition-all
                ${buttonThemeColors[themeName as ThemeName]}
                ${selectedButtonTheme === themeName ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                ${themeName === 'white' ? 'border border-zinc-200' : ''}
                hover:scale-110
              `}
              aria-label={`${themeName} theme`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <label className="text-sm font-medium text-zinc-500">Modal Theme</label>
        <div className="flex gap-3">
          {Object.keys(modalThemes).map((themeName) => (
            <button
              key={themeName}
              onClick={() => onModalThemeChange(themeName as ModalThemeName)}
              className={`
                w-8 h-8 rounded-full transition-all
                ${themeName === 'light' ? 'bg-white border border-zinc-200' : 'bg-black'}
                ${selectedModalTheme === themeName ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                hover:scale-110
              `}
              aria-label={`${themeName} modal theme`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 