'use client';

import { Dispatch, SetStateAction, useCallback } from "react";
import FileUploader from "./FileUploader";
import { deserializeWayPoints, WayPointJsonsSchema, serializeWayPoints, WayPoint } from "./utils";
import { downloadFile } from "@/utils/downloadFile";

export type WayPointActiveButtonsProps = {
    waypoints: WayPoint[],
    setWaypoints: Dispatch<SetStateAction<WayPoint[]>>,
    setEditRow: Dispatch<SetStateAction<number>>,
}

export default function WayPointActiveButtons({ waypoints, setWaypoints, setEditRow }: WayPointActiveButtonsProps) {
    const uploadWaypoints = useCallback<(files: FileList) => void>(async (files: FileList) => {
        for (const file of files) {
            try {
                const data: unknown = JSON.parse(await file.text());
                const result = WayPointJsonsSchema.safeParse(data);
                if (result.success) {
                    // Ensure unique IDs when adding new waypoints
                    const newWaypoints = deserializeWayPoints(result.data).map((wp, i) => ({
                        ...wp,
                        id: wp.data.id || `uploaded-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`, // Robust unique ID
                    }));
                    console.log({ type: "uploadWaypoints", newWaypoints })

                    setWaypoints(prevWaypoints => [...prevWaypoints, ...newWaypoints]);
                } else {
                    console.error("Failed to parse waypoint file:", result.error);
                }
            } catch (error) {
                console.error("Error reading or parsing file:", error);
                // Handle non-JSON or corrupted files
            }
        }
    }, [setWaypoints]);

    const downloadWaypoints = useCallback<() => void>(() => {
        const results = serializeWayPoints(waypoints);
        console.log({ type: "downloadWaypoints", waypoints, results });
        const resultsText = JSON.stringify(results, null, 2);
        downloadFile(new File([resultsText], "waypoints.json")); // Prettier JSON output
    }, [waypoints]);

    return (
        <div className="flex gap-2 mt-4">
            <FileUploader handleFiles={uploadWaypoints}>Upload Waypoints</FileUploader>
            <button
                onClick={() => {
                    // Ensure new waypoint gets a unique ID
                    const newId = `new-${Date.now()}-${waypoints.length}-${Math.random().toString(36).substring(2, 9)}`; // More robust unique ID
                    
                    const newRow: WayPoint = {
                        data: {
                            id: newId,
                            label: `Waypoint ${waypoints.length + 1}`,
                            height: 0,
                        },
                        position: {
                            x: 0,
                            y: 0,
                        }
                    }
                    
                    setWaypoints(prevWaypoints => [...prevWaypoints, newRow]);
                    setEditRow(waypoints.length); // Set edit mode for the newly added row
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
                Add Waypoint
            </button>
            <button
                onClick={downloadWaypoints}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
                Download Waypoints
            </button>
            <button
                onClick={() => {
                    setWaypoints([]);
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
                Delete WayPoints
            </button>
        </div>
    )
}