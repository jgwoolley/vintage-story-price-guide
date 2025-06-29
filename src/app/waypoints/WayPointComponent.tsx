'use client';

import { downloadFile } from "@/utils/downloadFile";
import { ChangeEventHandler, Dispatch, MouseEventHandler, PropsWithChildren, SetStateAction, useCallback, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import { useMemo } from "react";
import { useEffect } from "react";
import { calculateDistance, deserializeWayPoints, serializeWayPoints, WayPoint, WayPointJsonsSchema } from "./utils";
import WayPointSelection from "./WayPointSelection";
import WayPointRow from "./WayPointRow";

type FileUploaderProps = PropsWithChildren<{
    handleFiles: (files: FileList) => void
}>;

function FileUploader({ handleFiles, children }: FileUploaderProps) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };

    const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        if (e.target.files) {
            const files = e.target.files;
            handleFiles(files);
        }
    };

    return (
        <>
            <button onClick={handleClick}>
                {children}
            </button>
            <input
                type="file"
                onChange={handleChange}
                ref={hiddenFileInput}
                style={{ display: 'none' }} // Hide the input element
            />
        </>
    );
}

// Cytoscape stylesheet definitions for nodes and edges
const stylesheet: cytoscape.Stylesheet[] = [
    {
        selector: 'node',
        style: {
            'background-color': '#666',
            label: 'data(name)',
            // 'font-size': '12px',
            // color: '#fff',
            // 'text-halign': 'center',
            // 'text-valign': 'center',
            'width': '20px', // Fixed node size
            'height': '20px',
            'border-width': 1,
            'border-color': '#444',
            // 'text-outline-color': '#333',
            // 'text-outline-width': 1,
            // 'text-transform': 'uppercase',
        },
    },
    {
        selector: 'edge',
        style: {
            'width': 2,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(weight)', // Show weight if applicable
            // 'font-size': '8px',
            // 'color': '#666',
            // 'text-background-opacity': 1,
            // 'text-background-color': '#eee',
            // 'visibility': 'visible', // Default to visible
            // 'text-margin-y': -10, // Adjust label position
            // 'line-cap': 'round',
            // 'arrow-scale': 0.8,
            // 'text-rotation': 'autorotate', // Rotate labels with edges
        },
    },
    {
        selector: '.highlighted-path',
        style: {
            'line-color': 'red',
            'target-arrow-color': 'red',
            'width': 4,
            // 'visibility': 'visible', // Ensure visible
            'opacity': 1, // Ensure opaque
            // 'z-index': 9999, // Bring highlighted path to front
        },
    },
    {
        selector: '.highlighted-node',
        style: {
            'background-color': 'blue',
            'border-width': 2,
            'border-color': 'darkblue',
            // 'z-index': 9999, // Bring highlighted node to front
        },
    },
    {
        selector: '.source-node',
        style: {
            'background-color': 'green',
            'border-width': 3,
            'border-color': 'darkgreen',
            // 'z-index': 9999,
        },
    },
    {
        selector: '.hidden-edge',
        style: {
            // 'visibility': 'hidden', // Used to hide non-shortest path edges
            'opacity': 0,
            'width': 0.1, // Small width to avoid rendering artifacts even if invisible
        },
    },
    // Style for teleporter edges (weight = 0)
    {
        selector: 'edge[weight = 0]',
        style: {
            'line-color': 'purple',
            'target-arrow-color': 'purple',
            'line-style': 'dotted', // Make them dotted for visual distinction
            'label': 'Teleporter',
            // 'font-size': '10px',
            // 'text-background-color': '#f0f',
            // 'text-background-opacity': 0.7,
        },
    },
];

/**
 * Type for a single step in the calculated path.
 */
type PathStep = {
    from: string;
    to: string;
    distance: number;
};

export default function WayPointComponent() {
    const [waypoints, setWaypoints] = useState<WayPoint[]>([]);
    // Initialize source/destination to undefined, let useEffect handle initial assignment
    const [sourceNode, setSourceNode] = useState<WayPoint | undefined>(undefined);
    const [destinationNode, setDestinationNode] = useState<WayPoint | undefined>(undefined);
    const [editRow, setEditRow] = useState<number>(-1);
    const [pathSteps, setPathSteps] = useState<PathStep[]>([]); // New state for path details

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

    /**
     * Memoized calculation of Cytoscape elements (nodes and edges) from waypoints.
     */
    const elements = useMemo<cytoscape.ElementDefinition[]>(() => {
        const results: cytoscape.ElementDefinition[] = [];
        const addedEdges = new Set<string>(); // To prevent duplicate edges (e.g., A-B and B-A)

        // 1. Add Nodes
        for (const waypoint of waypoints) {
            results.push({
                group: 'nodes', // Explicitly define group
                position: {
                    x: waypoint.x,
                    y: waypoint.z, // Assuming z-coordinate maps to y-axis in 2D graph
                },
                data: {
                    name: waypoint.name,
                    id: waypoint.id,
                },
            });
        }

        // 2. Add Edges (for all relevant connections)
        for (let i = 0; i < waypoints.length; i++) {
            const source = waypoints[i];
            // Iterate from i+1 to avoid self-loops and duplicate edges (A-B vs B-A)
            for (let j = i + 1; j < waypoints.length; j++) {
                const destination = waypoints[j];

                const weight = Math.round(calculateDistance({
                    source: source,
                    destination: destination,
                }));

                // Only add an edge if it has a valid, non-infinite distance (0 for teleporters included)
                if (weight !== Infinity && !isNaN(weight)) {
                    // Create a canonical edge ID to avoid duplicates (e.g., ensure edge-A-B is same as edge-B-A)
                    const edgeId = [source.id, destination.id].sort().join('-'); // Sort IDs for consistent ID
                    if (!addedEdges.has(edgeId)) { // Check if this unique edge has already been added
                        results.push({
                            group: 'edges', // Explicitly define group
                            data: {
                                source: source.id,
                                target: destination.id,
                                weight: weight,
                                id: edgeId,
                            },
                        });
                        addedEdges.add(edgeId); // Mark as added
                    }
                }
            }
        }
        return results;
    }, [waypoints]); // Dependency on waypoints

    const cyRef = useRef<cytoscape.Core | null>(null); // Ref to hold the Cytoscape instance

    /**
     * useEffect hook for handling shortest path highlighting and edge visibility.
     */
    useEffect(() => {
        if (!cyRef.current) {
            return;
        }

        const cy = cyRef.current;

        // Clear all previous highlights and classes
        cy.elements().removeClass('highlighted-path highlighted-node source-node highlighted-target hidden-edge');

        // If a source and destination are selected and they are different
        if (sourceNode && destinationNode && sourceNode.id !== destinationNode.id) {
            cy.edges().addClass('hidden-edge'); // Temporarily hide all edges for path highlighting

            const aStarResult = cy.elements().aStar({
                root: `#${sourceNode.id}`,
                goal: `#${destinationNode.id}`,
                // weight: edge => {
                //     const edgeWeight = edge.data('weight');
                //     // Ensure weight is a number, default to 1 if problematic
                //     return typeof edgeWeight === 'number' && !isNaN(edgeWeight) ? edgeWeight : 1;
                // },
                directed: false, // Set to true if your graph is directed
            });

            const path = aStarResult.path;

            if (path && path.length > 0) {
                // Remove hidden-edge class and add highlight class for path elements
                path.edges().removeClass('hidden-edge').addClass('highlighted-path');
                path.nodes().addClass('highlighted-node');

                // Ensure source and destination nodes are specifically highlighted
                cy.getElementById(sourceNode.id).addClass('source-node');
                cy.getElementById(destinationNode.id).addClass('highlighted-node');

                // Populate path steps for the table
                const currentPathSteps: PathStep[] = [];
                for (let i = 0; i < path.nodes().length - 1; i++) {
                    const fromNode = path.nodes()[i];
                    const toNode = path.nodes()[i + 1];
                    const edge = fromNode.edgesWith(toNode);

                    if (edge.length > 0) {
                        currentPathSteps.push({
                            from: fromNode.data('name'),
                            to: toNode.data('name'),
                            // distance: edge.data('weight') || 0,
                            distance: 0,
                        });
                    }
                }
                setPathSteps(currentPathSteps);
                cy.fit(path);
            } else {
                console.log("No path found between selected nodes. Showing all edges.");
                cy.edges("edge[weight != 0]").removeClass('hidden-edge'); // If no path, show all edges again
                cy.getElementById(sourceNode.id).addClass('source-node');
                if (destinationNode) {
                    cy.getElementById(destinationNode.id).addClass('highlighted-node');
                }
            }
        } else {
            // If no source/destination is selected or they are the same, show all edges
            cy.edges("edge[weight != 0]").removeClass('hidden-edge');
            setPathSteps([]);
        }
    }, [sourceNode, destinationNode, waypoints]); // Re-run when these dependencies change

    /**
     * useEffect hook for setting initial source/destination nodes.
     */
    useEffect(() => {
        // Set initial source/destination if waypoints exist and they are not already set
        if (waypoints.length > 0) {
            if (!sourceNode) {
                setSourceNode(waypoints[0]);
            }
            if (!destinationNode) {
                setDestinationNode(waypoints[0]);
            }
        } else {
            // If waypoints become empty, clear source/destination
            setSourceNode(undefined);
            setDestinationNode(undefined);
        }
    }, [waypoints, sourceNode, destinationNode]); // Dependencies for this effect


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
                                    if(cy == undefined) {
                                        return;
                                    }
                                    cy.fit(cy.$id(waypoint.id));
                                }}
                                setDestinationNode={setDestinationNode}
                                setSourceNode={setSourceNode}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
                <FileUploader handleFiles={async (files) => {
                    for (const file of files) {
                        try {
                            const data: unknown = JSON.parse(await file.text());
                            const result = WayPointJsonsSchema.safeParse(data);
                            if (result.success) {
                                // Ensure unique IDs when adding new waypoints
                                const newWaypoints = deserializeWayPoints(result.data).map((wp, i) => ({
                                    ...wp,
                                    id: wp.id || `uploaded-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`, // Robust unique ID
                                }));
                                setWaypoints(prevWaypoints => [...prevWaypoints, ...newWaypoints]);
                            } else {
                                console.error("Failed to parse waypoint file:", result.error);
                                // You might want to show a user-friendly error message here
                            }
                        } catch (error) {
                            console.error("Error reading or parsing file:", error);
                            // Handle non-JSON or corrupted files
                        }
                    }
                }}>Upload Waypoints</FileUploader>

                <button
                    onClick={() => {
                        // Ensure new waypoint gets a unique ID
                        const newId = `new-${Date.now()}-${waypoints.length}-${Math.random().toString(36).substring(2, 9)}`; // More robust unique ID
                        setWaypoints(prevWaypoints => [...prevWaypoints, { id: newId, name: `Waypoint ${waypoints.length + 1}`, x: 0, y: 0, z: 0 }]);
                        setEditRow(waypoints.length); // Set edit mode for the newly added row
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                    Add Waypoint
                </button>
                <button
                    onClick={() => {
                        const results = serializeWayPoints(waypoints);
                        downloadFile(new File([JSON.stringify(results, null, 2)], "waypoints.json")); // Prettier JSON output
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                >
                    Download Waypoints
                </button>
            </div>

            <h3>Select Source / Destination Waypoints</h3>

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
                        emptyValid={false}
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
                        emptyValid={false}
                    />
                </div>
            </div>

            <h3>Steps</h3>
            <table>
                <thead>
                    <tr>
                        <th>to</th>
                        <th>from</th>
                        <th>distance</th>
                    </tr>
                </thead>
                <tbody>
                     {pathSteps?.map((x, index) => (<tr key={index}>
                        <td>{x.to}</td>
                        <td>{x.from}</td>
                        <td>{Math.round(x.distance * 10) / 10}</td>
                    </tr>))}
                </tbody>
            </table>

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