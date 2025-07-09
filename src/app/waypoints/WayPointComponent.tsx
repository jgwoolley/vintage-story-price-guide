'use client';

import cytoscape from "cytoscape";
import { useCallback, useRef, useState } from "react";
import CytoscapeComponent from "@/components/CytoscapeComponent";
import useWayPointEdges from "./useWayPointEdges";
import { useWayPointGraph } from "./useWayPointGraph";
import useWayPointStylesheet from "./useWayPointStylesheet";
import { calculateDistance, PathStep, WayPoint } from "./utils";
import WayPointActiveButtons from "./WayPointActiveButtons";
import WayPointRow from "./WayPointRow";

export default function WayPointComponent() {
    const [waypoints, setWaypoints] = useState<WayPoint[]>([]);
    // Initialize source/destination to undefined, let useEffect handle initial assignment
    const [sourceNode, setSourceNode] = useState<WayPoint | undefined>(undefined);
    const [destinationNode, setDestinationNode] = useState<WayPoint | undefined>(undefined);
    const [editRow, setEditRow] = useState<number>(-1);
    const [pathSteps, setPathSteps] = useState<PathStep[]>([]); // New state for path details
    const cyRef = useRef<cytoscape.Core | null>(null); // Ref to hold the Cytoscape instance
    const showDebugInfo = false;

    // Callback to remove waypoints
    const splitWaypoints = useCallback((start: number, deleteCount?: number) => {
        setEditRow(-1);
        const newWaypoints = [...waypoints]; // Create a mutable copy
        const results = newWaypoints.splice(start, deleteCount); // splice modifies newWaypoints in place

        results.forEach(row => {
            // If the removed waypoint was the source or destination, clear it
            if (row.data.id === sourceNode?.data.id) { // Compare by ID for object equality
                setSourceNode(undefined);
            }
            if (row.data.id === destinationNode?.data.id) { // Compare by ID
                setDestinationNode(undefined);
            }
        });

        setWaypoints(newWaypoints); // Update state with the modified array
        return results;
    }, [waypoints, sourceNode, destinationNode]); // Add sourceNode and destinationNode to dependencies

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
    }, [])

    return (
        <div className="p-4 space-y-4 font-sans text-gray-800 bg-gray-50 min-h-screen">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">WayPoint Management</h3>
            <h3>Graph</h3>
            {/* Waypoint Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waypoint Name</th>
                            {showDebugInfo && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waypoint Id</th>}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">X</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Y</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Z</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
                            {showDebugInfo && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection Id</th>}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {waypoints.map((row, index) => (
                            <WayPointRow
                                key={row.data.id} // Use row.id for key if it's unique
                                row={row}
                                index={index}
                                splitWaypoints={splitWaypoints}
                                editRow={editRow}
                                setEditRow={setEditRow}
                                waypoints={waypoints}
                                setWaypoints={setWaypoints}
                                onZoom={(waypoint) => {
                                    const cy = cyRef.current;
                                    if (cy == undefined) {
                                        return;
                                    }
                                    cy.fit(cy.$id(waypoint.data.id));
                                }}
                                destinationNode={destinationNode}
                                setDestinationNode={setDestinationNode}
                                sourceNode={sourceNode}
                                setSourceNode={setSourceNode}
                                showDebugInfo={showDebugInfo}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Buttons */}
            <h4>WayPoint Actions</h4>
            <WayPointActiveButtons
                waypoints={waypoints}
                setWaypoints={setWaypoints}
                setEditRow={setEditRow}
            />

            <h4>Graph</h4>

            <div style={{
                display: "flex",
                position: "relative",
                height: "100vh",
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
                            <table>
                                <thead>
                                    <tr>
                                        {showDebugInfo && <th>edge id</th>}
                                        <th>from</th>
                                        {showDebugInfo && <th>from id</th>}
                                        <th>to</th>
                                        {showDebugInfo && <th>to id</th>}
                                        <th>distance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pathSteps.map((x, index) => (<tr key={index}>
                                        {showDebugInfo && <td>{x.id}</td>}
                                        <td>{x.from.data("name")}</td>
                                        {showDebugInfo && <td>{x.from.id()}</td>}
                                        <td>{x.to.data("name")}</td>
                                        {showDebugInfo && <td>{x.to.id()}</td>}
                                        <td>{Math.round(x.distance * 10) / 10}</td>
                                    </tr>))}
                                    <tr>
                                        <td><b>Total</b></td>
                                        <td><b></b></td>
                                        {showDebugInfo && (
                                            <>
                                                <td><b></b></td>
                                                <td><b></b></td>
                                                <td><b></b></td>
                                            </>
                                        )}
                                        <td><b>{pathSteps.reduce((acc, obj) => acc + obj.distance, 0)}</b></td>
                                    </tr>
                                    <tr>
                                        <td><b>bird&#39;s eye distance</b></td>
                                        <td><b></b></td>
                                        {showDebugInfo && (
                                            <>
                                                <td><b></b></td>
                                                <td><b></b></td>
                                                <td><b></b></td>
                                            </>
                                        )}
                                        <td><b>{Math.round(calculateDistance({ source: sourceNode, destination: destinationNode }))}</b></td>
                                    </tr>
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}