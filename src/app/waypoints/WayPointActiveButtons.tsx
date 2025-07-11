'use client';

import { downloadFile } from "@/utils/downloadFile";
import { Button, ButtonGroup } from "@mui/material";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import FileUploader from "./FileUploader";
import { deserializeWayPoints, serializeWayPoints, WayPoint, WayPointJsonsSchema } from "./utils";

export type WayPointActiveButtonsProps = {
    sourceNode: WayPoint | undefined,
    // setSourceNode: Dispatch<SetStateAction<WayPoint | undefined>>,
    destinationNode: WayPoint | undefined,
    // setDestinationNode: Dispatch<SetStateAction<WayPoint | undefined>>,
    waypoints: WayPoint[],
    setWaypoints: Dispatch<SetStateAction<WayPoint[]>>,
}

export default function WayPointActiveButtons({ waypoints, setWaypoints, sourceNode, destinationNode }: WayPointActiveButtonsProps) {
    const [createdTime, setCreatedTime] = useState<Date>();
    const [modifiedTime, setModifiedTime] = useState<Date>();

    const uploadWaypoints = useCallback<(files: FileList) => void>(async (files: FileList) => {
        for (const file of files) {
            try {
                const data: unknown = JSON.parse(await file.text());
                const result = WayPointJsonsSchema.safeParse(data);

                if (result.success) {
                    if (createdTime != undefined) {
                        setCreatedTime(result.data.createdTime);
                    }

                    if (createdTime != undefined) {
                        setModifiedTime(result.data.modifiedTime);
                    }

                    const [deserializedWaypoints, newIds] = deserializeWayPoints(result.data);

                    // Ensure unique IDs when adding new waypoints
                    const newWaypoints = deserializedWaypoints.map((wp, i) => ({
                        ...wp,
                        id: wp.data.id || `uploaded-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`, // Robust unique ID
                    }));
                    console.log({ type: "uploadWaypoints", newWaypoints })

                    setWaypoints(prevWaypoints => {
                        const oldIds = new Set(prevWaypoints.map(x => x.data.id));
                        const sharedIds = newIds.intersection(oldIds);
                        if(sharedIds.size > 0) {
                            console.error({type: "Had shared ids", sharedIds});
                            // TODO: In event of shared ids maybe do something smarter...
                            return prevWaypoints;
                        }

                        return [...prevWaypoints, ...newWaypoints];
                    });

                    // if(result.data.source) {
                    //     const value = newWaypoints.find(x => x.data.id === result.data.source);
                    //     if(value) {
                    //         setSourceNode(value);
                    //     }
                    // }
                    // if(result.data.destination) {
                    //     const value = newWaypoints.find(x => x.data.id === result.data.destination);
                    //     if(value) {
                    //         setDestinationNode(value);
                    //     }
                    // }

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
        const results = serializeWayPoints({ createdTime, modifiedTime, waypoints, sourceNode, destinationNode });
        console.log({ type: "downloadWaypoints", waypoints, results });
        const resultsText = JSON.stringify(results, null, 2);
        downloadFile(new File([resultsText], "waypoints.json")); // Prettier JSON output
    }, [waypoints, sourceNode, destinationNode]);

    return (
        <ButtonGroup >
            <FileUploader handleFiles={uploadWaypoints}>Upload Waypoints</FileUploader>
            <Button
                onClick={() => {
                    // Ensure new waypoint gets a unique ID
                    const newId = `new-${Date.now()}-${waypoints.length}-${Math.random().toString(36).substring(2, 9)}`; // More robust unique ID

                    const newRow: WayPoint = {
                        data: {
                            id: newId,
                            label: `Waypoint ${waypoints.length + 1}`,
                            height: 0,
                            createdTime: new Date(),
                            modifiedTime: new Date(),
                            origin: "browser",
                        },
                        position: {
                            x: 0,
                            y: 0,
                        }
                    }

                    setWaypoints(prevWaypoints => [...prevWaypoints, newRow]);
                }}
            >
                Add Waypoint
            </Button>
            <Button
                onClick={downloadWaypoints}
            >
                Download Waypoints
            </Button>
            <Button
                onClick={() => {
                    setWaypoints([]);
                }}
            >
                Delete WayPoints
            </Button>
            <Button onClick={() => alert("Not implemented")}>ReCenter Graph</Button>
        </ButtonGroup>
    )
}