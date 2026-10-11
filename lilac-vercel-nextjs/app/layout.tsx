import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'라일락 | 숫자를 이해하면, 투자가 쉬워져요',description:'한국·미국 주식의 실제 차트와 RSI, 이동평균, PER, PBR, ROE를 쉬운 말로 배우세요.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
