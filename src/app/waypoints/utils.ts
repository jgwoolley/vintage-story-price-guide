import { z } from "zod";

export type Node = {
    x: number,
    z: number,
}

export function calculateDistance({ source, destination }: { source: Node, destination: Node }) {
    const dx = source.x - destination.x;
    const dz = source.z - destination.z;
    return Math.sqrt(dx * dx + dz * dz);
}

export const WayPointJsonSchema = z.object({
    name: z.string(),
    x: z.number(),
    y: z.number(),
    z: z.number(),
    connection: z.number().optional(),
});

export type WayPointJson = z.infer<typeof WayPointJsonSchema>;
export const WayPointJsonsSchema = z.array(WayPointJsonSchema);
export type WayPointJsons = z.infer<typeof WayPointJsonsSchema>;

export type WayPoint = {
    id: string,
    name: string,
    x: number,
    y: number,
    z: number,
    connection?: WayPoint,
}

export function deserializeWayPoints(waypoints: WayPointJsons): WayPoint[] {
    const results: WayPoint[] = [];
    for (let index = 0; index < waypoints.length; index++) {
        const row = waypoints[index];
        results.push({
            id: `${index}`,
            name: row.name,
            x: row.x,
            y: row.y,
            z: row.z,
        });
    }

    for (let i = 0; i < results.length; i++) {
        const { connection } = waypoints[i];
        if (connection != undefined) {
            results[i].connection = results[connection];
        }
    }

    return results;
}

export function serializeWayPoints(waypoints: WayPoint[]) {
    const results: WayPointJson[] = [];
    for (const row of waypoints) {
        const connection = waypoints.findIndex(obj => obj === row.connection);
        results.push({
            name: row.name,
            x: row.x,
            y: row.y,
            z: row.z,
            connection: connection === -1 ? undefined : connection,
        });
    }

    return results;
}

export function stringifyWayPoint(waypoint: WayPoint) {
    return `${waypoint.name} (${waypoint.x}, ${waypoint.y}, ${waypoint.z})`;
}
