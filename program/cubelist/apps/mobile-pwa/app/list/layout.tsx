import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '큐브 리스트',
};

// /list는 사용자 세션·useSearchParams(?board=)에 의존 — prerender 대신 dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * /list 라우트 — 큐브 리스트 본 UI
 *
 * 거치 모드 진입 가능한 모든 경로. layout에서 cubelist-mount-mode 클래스 부여
 * 가능. 모드 전환은 useMountMode 훅에서 토글.
 */
export default function ListLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface">{children}</div>;
}
