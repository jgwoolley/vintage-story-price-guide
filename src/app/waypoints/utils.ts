import { z } from "zod";

export const WayPointJsonSchema = z.object({
    data: z.object({ 
        id: z.string(),
        label: z.string(),
        height: z.number(),
    }),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    connection: z.string().optional(),
});

export type WayPointJson = z.infer<typeof WayPointJsonSchema>;
export const WayPointJsonsSchema = z.array(WayPointJsonSchema);
export type WayPointJsons = z.infer<typeof WayPointJsonsSchema>;

export type WayPoint = {
    data: {
        id: string,
        label: string,
        height: number,
    },
    position: {
        x: number,
        y: number, // actually z
    },
    connection?: WayPoint,
}

export function calculateDistance({ source, destination }: { source: WayPoint, destination: WayPoint }) {
    if(source.connection?.data.id === destination.data.id || destination.connection?.data.id === source.data.id) {
        return 0;
    }

    const dx = source.position.x - destination.position.x;
    const dz = source.position.y - destination.position.y;
    return Math.sqrt(dx * dx + dz * dz);
}

export function deserializeWayPoints(waypoints: WayPointJsons): WayPoint[] {
    const results: WayPoint[] = [];
    for (let index = 0; index < waypoints.length; index++) {
        const row = waypoints[index];
        const newRow: WayPoint = {
            position: row.position,
            data: {
                id: row.data.id,
                height: row.data.height,
                label: row.data.label,
            },
        };
        results.push(newRow);
    }

    for (let i = 0; i < results.length; i++) {
        const { connection } = waypoints[i];
        if (connection != undefined) {
            results[i].connection = results.find(x => x.data.id === connection);
        }
    }

    return results;
}

export function serializeWayPoints(waypoints: WayPoint[]) {
    const results: WayPointJson[] = [];
    for (const row of waypoints) {
        const newRow: WayPointJson = {
            data: {
                id: row.data.id,
                label: row.data.label,
                height: row.data.height,
            },
            position: {
                x: row.position.x,
                y: row.position.y,
            },
            connection: row.connection?.data.id,
        }

        results.push(newRow);
    }

    return results;
}

export function stringifyWayPoint(waypoint: WayPoint) {
    return `${waypoint.data.label} (${waypoint.position.x}, ${waypoint.data.height}, ${waypoint.position.y})`;
}

/**
 * Type for a single step in the calculated path.
 */
export type PathStep = {
    id: string,
    from: cytoscape.NodeSingular;
    to: cytoscape.NodeSingular;
    distance: number;
};