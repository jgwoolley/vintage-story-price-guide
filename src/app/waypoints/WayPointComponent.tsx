'use client';

import cytoscape from "cytoscape";
import { useCallback, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import useWayPointEdges from "./useWayPointEdges";
import { useWayPointGraph } from "./useWayPointGraph";
import { calculateDistance, PathStep, WayPoint } from "./utils";
import WayPointActiveButtons from "./WayPointActiveButtons";
import WayPointRow from "./WayPointRow";
import WayPointSelection from "./WayPointSelection";
import useWayPointStylesheet from "./useWayPointStylesheet";

export default function WayPointComponent() {
    const [waypoints, setWaypoints] = useState<WayPoint[]>([]);
    // Initialize source/destination to undefined, let useEffect handle initial assignment
    const [sourceNode, setSourceNode] = useState<WayPoint | undefined>(undefined);
    const [destinationNode, setDestinationNode] = useState<WayPoint | undefined>(undefined);
    const [editRow, setEditRow] = useState<number>(-1);
    const [pathSteps, setPathSteps] = useState<PathStep[]>([]); // New state for path details
    const cyRef = useRef<cytoscape.Core | null>(null); // Ref to hold the Cytoscape instance

    // Callback to remove waypoints
    const splitWaypoints = useCallback((start: number, deleteCount?: number) => {
        setEditRow(-1);
        const newWaypoints = [...waypoints]; // Create a mutable copy
        const results = newWaypoints.splice(start, deleteCount); // splice modifies newWaypoints in place

        results.forEach(row => {
            // If the removed waypoint was the source or destination, clear it
            if (row.id === sourceNode?.id) { // Compare by ID for object equality
                setSourceNode(undefined);
            }
            if (row.id === destinationNode?.id) { // Compare by ID
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
        setWaypoints,
    });

    const stylesheet = useWayPointStylesheet();
    
    return (
        <div className="p-4 space-y-4 font-sans text-gray-800 bg-gray-50 min-h-screen">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">WayPoint Management</h3>

            {/* Waypoint Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waypoint Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">X</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Y</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Z</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {waypoints.map((row, index) => (
                            <WayPointRow
                                key={row.id} // Use row.id for key if it's unique
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
                                    cy.fit(cy.$id(waypoint.id));
                                }}
                                destinationNode={destinationNode}
                                setDestinationNode={setDestinationNode}
                                sourceNode={sourceNode}
                                setSourceNode={setSourceNode}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Buttons */}
            <h4>WayPoint Actions</h4>
            <WayPointActiveButtons 
                waypoints={[]} 
                setWaypoints={setWaypoints} 
                setEditRow={setEditRow}            
            />

            <h4>Select Source / Destination Waypoints</h4>

            {/* Source and Destination Selection */}
            <div className="flex gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg shadow flex-1">
                    <label htmlFor="sourceNode" className="block text-sm font-medium text-gray-700 mb-1">Source Waypoint: </label>
                    <WayPointSelection
                        name="sourceNode"
                        id="sourceNode"
                        node={sourceNode}
                        setNode={setSourceNode}
                        waypoints={waypoints}
                        emptyValid={true}
                    />
                </div>
                <div className="bg-white p-4 rounded-lg shadow flex-1">
                    <label htmlFor="destinationNode" className="block text-sm font-medium text-gray-700 mb-1">Destination Waypoint: </label>
                    <WayPointSelection
                        name="destinationNode"
                        id="destinationNode"
                        node={destinationNode}
                        setNode={setDestinationNode}
                        waypoints={waypoints}
                        emptyValid={true}
                    />
                </div>
            </div>

            <h3>Steps</h3>
            <p>This is the path you will want to travel.</p>
            <table>
                <thead>
                    <tr>
                        <th>from</th>
                        <th>to</th>
                        <th>distance</th>
                    </tr>
                </thead>
                <tbody>
                    {pathSteps?.map((x, index) => (<tr key={index}>
                        <td>{x.from}</td>
                        <td>{x.to}</td>
                        <td>{Math.round(x.distance * 10) / 10}</td>
                    </tr>))}
                </tbody>
            </table>
            <p>This would be the bird's eye distance: {(sourceNode != undefined && destinationNode != undefined ) ? Math.round(calculateDistance({source: sourceNode, destination: destinationNode})): "N/A"}</p>

            <h3>Graph</h3>
            {/* Cytoscape Graph Visualization */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 mt-4">
                <CytoscapeComponent
                    elements={elements}
                    stylesheet={stylesheet}
                    minZoom={0.5}
                    maxZoom={2}
                    boxSelectionEnabled={false} // Disable box selection for cleaner interaction
                    wheelSensitivity={0.5} // Adjust zoom sensitivity
                    className="w-full" // Ensure it takes full width
                    style={{ height: "80vh", minHeight: "400px" }} // Responsive height
                    autolock={true}
                    cy={(cy) => {
                        cyRef.current = cy; // Store Cytoscape instance
                    }}
                />
            </div>
        </div>
    );
}