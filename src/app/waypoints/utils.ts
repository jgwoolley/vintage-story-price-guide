import { z } from "zod";

export const WayPointOriginSchema = z.enum(["browser"]);
export type WayPointOrigin = z.infer<typeof WayPointOriginSchema>;

export const WayPointJsonSchema = z.object({
    data: z.object({
        id: z.string(),
        label: z.string(),
        height: z.number(),
        createdTime: z.coerce.date(),
        modifiedTime: z.coerce.date(),
        origin: WayPointOriginSchema,
    }),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    connection: z.string().optional(),
});

export type WayPointJson = z.infer<typeof WayPointJsonSchema>;
export const WayPointJsonsSchema = z.object({
    createdTime: z.coerce.date(),
    modifiedTime: z.coerce.date(),
    source: z.string().optional(),
    destination: z.string().optional(),
    waypoints: z.array(WayPointJsonSchema),
});
export type WayPointsJson = z.infer<typeof WayPointJsonsSchema>;

export type WayPoint = {
    data: {
        id: string,
        label: string,
        height: number,
        createdTime: Date,
        modifiedTime: Date,
        origin: WayPointOrigin,
    },
    position: {
        x: number,
        y: number, // actually z
    },
    connection?: WayPoint,
}

export function calculateDistance({ source, destination }: { source: WayPoint, destination: WayPoint }) {
    if (source.connection?.data.id === destination.data.id || destination.connection?.data.id === source.data.id) {
        return 0;
    }

    const dx = source.position.x - destination.position.x;
    const dz = source.position.y - destination.position.y;
    return Math.sqrt(dx * dx + dz * dz);
}

export function deserializeWayPoints(waypoints: WayPointsJson): WayPoint[] {
    const results: WayPoint[] = [];
    const ids = new Set<string>();
    for (const row of waypoints.waypoints) {
        const id = row.data.id;
        if (ids.has(id)) {
            console.error(`Duplicate ids: ${id}`);
            return [];
        } else {
            ids.add(id);
        }
        console.log(id);

        const newRow: WayPoint = {
            position: row.position,
            data: {
                id: id,
                height: row.data.height,
                label: row.data.label,
                modifiedTime: row.data.modifiedTime,
                createdTime: row.data.createdTime,
                origin: "browser",
            },
        };
        results.push(newRow);
    }

    for (const sourceJson of waypoints.waypoints) {
        const { connection: connectionId } = sourceJson;
        if (connectionId != undefined) {
            const source = results.find(x => x.data.id === sourceJson.data.id);
            const connection = results.find(x => x.data.id === connectionId);
            if (source == undefined || connection == undefined) {
                console.error({ sourceJson, source, connection });
                continue;
            }
            source.connection = connection;
        }
    }



    return results;
}

export function serializeWayPoints({ createdTime, modifiedTime, waypoints, sourceNode, destinationNode }: { createdTime: Date | undefined, modifiedTime: Date | undefined, waypoints: WayPoint[], sourceNode: WayPoint | undefined, destinationNode: WayPoint | undefined }): WayPointsJson {
    const newWaypoints: WayPointJson[] = [];
    for (const row of waypoints) {
        const newRow: WayPointJson = {
            data: {
                id: row.data.id,
                label: row.data.label,
                height: row.data.height,
                createdTime: new Date(),
                modifiedTime: new Date(),
                origin: row.data.origin,
            },
            position: {
                x: row.position.x,
                y: row.position.y,
            },
            connection: row.connection?.data.id,
        }

        newWaypoints.push(newRow);
    }

    return {
        source: sourceNode?.data.id,
        destination: destinationNode?.data.id,
        modifiedTime: modifiedTime ? modifiedTime : new Date(),
        createdTime: createdTime ? createdTime : new Date(),
        waypoints: newWaypoints,
    };
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