import { WifiOff } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline — SkillSync',
};

export default function OfflinePage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col items-center justify-center p-4">
      <WifiOff size={40} className="text-muted-foreground mb-4" />
      <p className="text-center text-muted-foreground">
        You are offline. Please check your connection and try again.
      </p>
    </div>
  );
}
