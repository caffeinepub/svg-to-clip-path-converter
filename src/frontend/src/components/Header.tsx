import { Scissors } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scissors className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">SVG to Clip-Path Converter</h1>
            <p className="text-sm text-muted-foreground">Transform SVG paths into CSS clip-path formats</p>
          </div>
        </div>
      </div>
    </header>
  );
}
