import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import ConverterSection from './components/ConverterSection';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <ConverterSection />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
