import { redirect } from 'next/navigation';

/**
 * 루트 진입점 — 작동 화면(리스트)으로 즉시 리다이렉트.
 *
 * M-A §1: 작동 페이지를 메인 화면으로 (제작 UI는 보조).
 * 기존 랜딩 허브는 /list 헤더 내 보조 링크로 접근 가능.
 */
export default function RootPage() {
  redirect('/list');
}
