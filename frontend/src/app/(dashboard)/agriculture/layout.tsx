import React from 'react';

export default function AgricultureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-[calc(100vh-120px)] animate-in fade-in duration-300">
      {children}
    </div>
  );
}
