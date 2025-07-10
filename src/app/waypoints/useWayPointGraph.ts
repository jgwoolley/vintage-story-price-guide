import cytoscape from "cytoscape";
import { Dispatch, SetStateAction, useEffect } from "react";
import { PathStep, WayPoint } from "./utils";

export type UseWayPointGraphProps = {
    cy: cytoscape.Core | null,
    sourceNode: WayPoint | undefined,
    setSourceNode: Dispatch<SetStateAction<WayPoint | undefined>>,
    destinationNode: WayPoint | undefined,
    setDestinationNode: Dispatch<SetStateAction<WayPoint | undefined>>,
    setPathSteps: Dispatch<SetStateAction<PathStep[]>>,
    waypoints: WayPoint[],
    // setWaypoints: Dispatch<SetStateAction<WayPoint[]>>,
};

export function useWayPointGraph({ cy, sourceNode, setSourceNode, destinationNode, setDestinationNode, setPathSteps, waypoints }: UseWayPointGraphProps) {
    /**
 * useEffect hook for handling shortest path highlighting and edge visibility.
 */
    useEffect(() => {
        try {
            if (cy == undefined) {
                return;
            }

            // Clear all previous highlights and classes
            cy.elements().removeClass('highlighted-path highlighted-node source-node highlighted-target hidden-edge');

            if (waypoints == undefined || waypoints.length === 0) {
                return;
            }

            // If a source and destination are selected and they are different
            if (sourceNode != undefined && destinationNode != undefined && sourceNode.data.id !== destinationNode.data.id) {
                cy.edges().addClass('hidden-edge'); // Temporarily hide all edges for path highlighting

                const aStarResult = cy.elements().aStar({
                    root: `#${sourceNode.data.id}`,
                    goal: `#${destinationNode.data.id}`,
                    weight: edges => {
                        const edge = edges[0];
                        const edgeWeight = edge.data('weight');
                        // Ensure weight is a number, default to 1 if problematic
                        return typeof edgeWeight === 'number' && !isNaN(edgeWeight) ? edgeWeight : 1;
                    },
                    directed: false, // Set to true if your graph is directed
                });

                const path = aStarResult.path;

                if (path && path.length > 0) {
                    path.nodes().addClass('highlighted-node');

                    // Ensure source and destination nodes are specifically highlighted
                    cy.getElementById(sourceNode.data.id).addClass('source-node');
                    cy.getElementById(destinationNode.data.id).addClass('highlighted-node');

                    // Populate path steps for the table
                    const currentPathSteps: PathStep[] = [];
                    for (let i = 0; i < path.nodes().length - 1; i++) {
                        const fromNode = path.nodes()[i];
                        const toNode = path.nodes()[i + 1];
                        const edges = fromNode.edgesWith(toNode);
                        edges.removeClass('hidden-edge').addClass('highlighted-path');
                        if (edges.length > 0) {
                            edges.forEach(edge => {
                                currentPathSteps.push({
                                    id: edge.id(),
                                    from: fromNode,
                                    to: toNode,
                                    distance: edge.data('weight') || -1,
                                });
                            })
                        }
                    }
                    setPathSteps(currentPathSteps);
                    cy.fit(path);
                } else {
                    console.log("No path found between selected nodes. Showing all edges.");
                    cy.edges("edge[weight != 0]").removeClass('hidden-edge'); // If no path, show all edges again
                    cy.getElementById(sourceNode.data.id).addClass('source-node');
                    if (destinationNode) {
                        cy.getElementById(destinationNode.data.id).addClass('highlighted-node');
                    }
                }
            } else {
                // If no source/destination is selected or they are the same, show all edges
                cy.edges("edge[weight != 0]").removeClass('hidden-edge');
                setPathSteps([]);
            }
        } catch (e) {
            // TODO: This error might be happening due to issues serializing the source / dest objects...
            console.error(e);
        }
    }, [cy, setPathSteps, sourceNode, destinationNode, waypoints]); // Re-run when these dependencies change

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
    }, [waypoints, sourceNode, setSourceNode, destinationNode, setDestinationNode]); // Dependencies for this effect
}