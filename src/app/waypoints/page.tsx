import TeleportTable from "@/components/WayPointTable";
import Link from 'next/link'

export default function Page() {
  return (
    <>
      <h1>WayPoint Tool</h1>
      <Link href="/">Go Back</Link>
      <TeleportTable />
    </>
  );
}