import { Cpu } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          <div className="flex items-center">
            <Cpu className="h-8 w-8 text-primary" />
            <h1 className="ml-3 text-2xl font-bold text-foreground font-headline">
              TestPoint Admin
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
