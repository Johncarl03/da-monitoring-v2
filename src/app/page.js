"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Awtomatikong itatapon ang user sa login page
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#e8f5e9] flex items-center justify-center">
      <div className="animate-pulse text-[#1b5e20] font-black tracking-[0.5em] uppercase text-xs">
        Loading System...
      </div>
    </div>
  );
}