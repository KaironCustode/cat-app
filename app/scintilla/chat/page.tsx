'use client';

import ScintillaShell from '@/components/scintilla/ScintillaShell';
import ScintillaChat from '@/components/scintilla/ScintillaChat';

export default function ChatPage() {
  return (
    <ScintillaShell>
      <ScintillaChat />
    </ScintillaShell>
  );
}
