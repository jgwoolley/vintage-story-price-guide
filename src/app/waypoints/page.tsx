import { wayPointRoute } from "../routes";
import WayPointComponent from "./WayPointComponent";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: wayPointRoute.name,
  description: wayPointRoute.description,
};

export default function Page() {
  return (
    <WayPointComponent />
  );
}