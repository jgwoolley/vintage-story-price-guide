import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import MapIcon from '@mui/icons-material/Map';

export type RouteInfo = Readonly<{
  name: string,
  description: string,
  href: string,
  IconComponent: React.ComponentType,
}>;

export const tradesRoute: RouteInfo = {
    name: 'Vintage Story Trades Tool',
    description: 'Get the best deals with wandering traders! The best price guide around.',
    href: '/trades',
    IconComponent: LocalGroceryStoreIcon,
}

export const wayPointRoute: RouteInfo = {
    name: 'WayPoint Tool',
    description: 'Are you a clockmaker whose daliance with translocators has massively reduced the time it takes to get from point A to point B, but planning the optimal route has taken its tole on your sanity? Look no furhter than the WayPoint tool!',
    href:'/waypoints',
    IconComponent: MapIcon,
}

export const toolRoutes: Readonly<RouteInfo[]> = [
    tradesRoute,
    wayPointRoute,
];