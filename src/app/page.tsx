import { Typography } from '@mui/material';
import Link from 'next/link';

export default async function Home() {
  return (
    <>
    <Typography variant="h5" component="h5">Vintage Story Tools</Typography>
      <ul>
        <li><Link href="/trades">Trades Tool</Link></li>
        <li><Link href="/waypoints">WayPoint Tool</Link></li>
      </ul>
    </>
  );
}
