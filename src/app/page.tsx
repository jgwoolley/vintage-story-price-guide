import { Card, CardActionArea, CardContent, CardHeader, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import MapIcon from '@mui/icons-material/Map';

type ToolCardProps = {
  name: string,
  description: string,
  href: string,
  IconComponent: React.ComponentType,
}

function ToolCard({ name, description, href, IconComponent }: ToolCardProps) {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
      }}
    >
      <CardActionArea
        LinkComponent={Link}
        href={href}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <CardHeader
          avatar={
            <Tooltip title={name}>
              <IconButton aria-label={`${name} icon`} disableRipple>
                <IconComponent />
              </IconButton>
            </Tooltip>
          }
          title={<Typography variant="h6">{name}</Typography>}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default async function Home() {
  return (
    <>
      <Grid container spacing={4} sx={{ p: 4 }}>
        <ToolCard
          name='Vintage Story Trades Tool'
          description='Get the best deals with wandering traders! The best price guide around.'
          href='/trades'
          IconComponent={LocalGroceryStoreIcon}
        />
        <ToolCard
          name='WayPoint Tool'
          description='Are you a clockmaker whose daliance with translocators has massively reduced the time it takes to get from point A to point B, but planning the optimal route has taken its tole on your sanity? Look no furhter than the WayPoint tool!'
          href='/waypoints'
          IconComponent={MapIcon}
        />
      </Grid>
    </>
  );
}