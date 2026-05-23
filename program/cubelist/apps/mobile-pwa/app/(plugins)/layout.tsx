import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '플러그인 — 큐브 리스트',
};

export default function PluginsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
