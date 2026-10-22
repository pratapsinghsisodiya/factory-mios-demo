import Link from 'next/link';
export default function DemoNotice() {
  return <div className="demo-notice"><span><strong>CLIENT DEMO</strong> Synthetic data · saved in this browser</span><Link href="/guide">Guide & reset</Link></div>;
}
