import Link from 'next/link'

export default async function Home() {
  return (
    <div>
      <h1>Vintage Story Tools</h1>
      <ul>
        <li><Link href="/trades">Trades Tool</Link></li>
        <li><Link href="/waypoints">WayPoint Tool</Link></li>
      </ul>
    </div>
  );
}
