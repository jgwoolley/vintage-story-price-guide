'use client';

import CytoscapeComponent from "@/components/CytoscapeComponent";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import cytoscape from "cytoscape";
import { useCallback, useRef, useState } from "react";
import useWayPointEdges from "./useWayPointEdges";
import { useWayPointGraph } from "./useWayPointGraph";
import useWayPointStylesheet from "./useWayPointStylesheet";
import { calculateDistance, PathStep, WayPoint } from "./utils";
import WayPointActiveButtons from "./WayPointActiveButtons";
import WayPointEditDialog from "./WayPointEditDialog";
import WayPointsDataGrid from "./WayPointsDataGrid";

export default function WayPointComponent() {
    const [waypoints, setWayPoints] = useState<WayPoint[]>([]);
    // Initialize source/destination to undefined, let useEffect handle initial assignment
    const [sourceNode, setSourceNode] = useState<WayPoint | undefined>(undefined);
    const [destinationNode, setDestinationNode] = useState<WayPoint | undefined>(undefined);
    const [pathSteps, setPathSteps] = useState<PathStep[]>([]); // New state for path details
    const cyRef = useRef<cytoscape.Core | null>(null); // Ref to hold the Cytoscape instance

    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editRow, setEditRow] = useState<WayPoint>({ position: { x: 0, y: 0 }, data: { id: "", label: "", height: 0, createdTime: new Date(), modifiedTime: new Date(), origin: "browser" } });
    const onZoom = (waypoint: WayPoint) => {
        const cy = cyRef.current;
        if (cy == undefined) {
            return;
        }
        cy.fit(cy.$id(waypoint.data.id));
    };

    const handleOpenEditDialog = (waypoint: WayPoint) => {
        setEditRow(waypoint);
        onZoom(waypoint);
        setOpenEditDialog(true);
    };

    const elements = useWayPointEdges({ waypoints });
    useWayPointGraph({
        cy: cyRef.current,
        sourceNode,
        setSourceNode,
        destinationNode,
        setDestinationNode,
        setPathSteps,
        waypoints,
    });

    const stylesheet = useWayPointStylesheet();

    const cyFunction = useCallback<((cy: cytoscape.Core) => void)>((cy) => {
        cyRef.current = cy; // Store Cytoscape instance
        cy.on('select', 'node', function (evt) { // Or 'click' for desktop
            const node = evt.target;
            console.log({
                event: 'select node',
                nodeid: node.id(),
                nodedata: node.data(),
            });
        })
        cy.on('select', 'edge', function (evt) { // Or 'click' for desktop
            const edge = evt.target;
            console.log({
                event: 'select edge',
                nodeid: edge.id(),
                nodedata: edge.data(),
            });
        });
    }, []);

    return (
        <div >
            <h3>WayPoint Management</h3>
            <h3>Graph</h3>
            <div style={{
                display: "flex",
                position: "relative",
                height: "50vh",
                width: "100vw",
                overflow: "hidden",
            }}>
                <div style={{
                    flex: 1,
                    border: "solid #ddd",
                    display: "flex",
                    overflow: "hidden",
                }}>
                    <CytoscapeComponent
                        elements={elements}
                        stylesheet={stylesheet}
                        minZoom={0.5}
                        maxZoom={2}
                        boxSelectionEnabled={false} // Disable box selection for cleaner interaction
                        wheelSensitivity={0.5} // Adjust zoom sensitivity
                        className="w-full" // Ensure it takes full width
                        style={{ width: "100%", height: "100%", border: "solid #ddd" }} // Responsive height
                        autolock={true}
                        cy={cyFunction}
                    />
                </div>

                <div style={{
                    flex: 1,
                    border: "solid #ddd",
                    padding: "10px",
                    overflowY: "auto",
                }}>
                    {(sourceNode != undefined && destinationNode != undefined && pathSteps != undefined) && (
                        <>
                            <h3>Steps</h3>
                            <p>This is the path you will want to travel.</p>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>from</TableCell>
                                            <TableCell>to</TableCell>
                                            <TableCell>distance</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pathSteps.map((x, index) => (<TableRow key={index}>
                                            <TableCell>{x.from.data("label")}</TableCell>
                                            <TableCell>{x.to.data("label")}</TableCell>
                                            <TableCell>{Math.round(x.distance * 10) / 10}</TableCell>
                                        </TableRow>))}
                                        <TableRow>
                                            <TableCell><b>Total</b></TableCell>
                                            <TableCell><b></b></TableCell>
                                            <TableCell><b>{pathSteps.reduce((acc, obj) => acc + obj.distance, 0)}</b></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><b>bird&#39;s eye distance</b></TableCell>
                                            <TableCell><b></b></TableCell>
                                            <TableCell><b>{Math.round(calculateDistance({ source: sourceNode, destination: destinationNode }))}</b></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </div>
            </div>
            {/* Action Buttons */}
            <h4>WayPoint Actions</h4>
            <WayPointActiveButtons
                waypoints={waypoints}
                setWaypoints={setWayPoints}
                sourceNode={sourceNode}
                setSourceNode={setSourceNode}
                destinationNode={destinationNode}
                setDestinationNode={setDestinationNode}
            />
            <h4>Grid</h4>
            {/* Waypoint Table */}
            <WayPointsDataGrid
                sourceNode={sourceNode}
                rows={waypoints}
                onZoom={onZoom}
                setSourceNode={setSourceNode}
                setDestinationNode={setDestinationNode}
                handleOpenEditDialog={handleOpenEditDialog}
            />
            <WayPointEditDialog
                open={openEditDialog}
                setOpen={setOpenEditDialog}
                rows={waypoints}
                setRows={setWayPoints}
                editRow={editRow}
                setEditRow={setEditRow}
            />
        </div>
    );
}