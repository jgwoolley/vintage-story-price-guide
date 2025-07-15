'use client';

import CytoscapeComponent from "@/components/CytoscapeComponent";
import cytoscape, { Position } from "cytoscape";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import PathStepsTable, { OnZoomNode } from "./PathStepsTable";
import useWayPointEdges from "./useWayPointEdges";
import { useWayPointGraph } from "./useWayPointGraph";
import useWayPointStylesheet from "./useWayPointStylesheet";
import { PathStep, WayPoint } from "./utils";
import WayPointActiveButtons from "./WayPointActiveButtons";
import WayPointEditDialog from "./WayPointEditDialog";
import WayPointsDataGrid from "./WayPointsDataGrid";
import { SubmitSnackbarMessage } from "@/components/SnackbarProvider";

const submitSnackbarMessage: SubmitSnackbarMessage = (key, value, data) => {
    console.log({key, value, data});
}

export default function WayPointComponent() {
    const [waypoints, setWayPoints] = useState<WayPoint[]>([]);
    // Initialize source/destination to undefined, let useEffect handle initial assignment
    const [sourceNode, setSourceNode] = useState<WayPoint | undefined>(() => {
        if(waypoints.length > 2) {
            return waypoints[0];
        }
        return undefined;
    });
    const [destinationNode, setDestinationNode] = useState<WayPoint | undefined>(() => {
        if(waypoints.length > 2) {
            return waypoints[1];
        }
        return undefined;
    });
    const [pathSteps, setPathSteps] = useState<PathStep[]>([]); // New state for path details
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editRow, setEditRow] = useState<WayPoint>({ position: { x: 0, y: 0 }, data: { id: "", label: "", height: 0, createdTime: new Date(), modifiedTime: new Date(), origin: "browser" } });
    const cyRef = useRef<cytoscape.Core | null>(null); // Ref to hold the Cytoscape instance
    // const submitMessage = useContext(SubmitSnackbarContext);

    const onZoomNode = useCallback<OnZoomNode>((eles, padding) => {
        const cy = cyRef.current;
        if (cy == undefined) {
            return;
        }
        cy.fit(eles, padding);
    }, [cyRef]);

    const onZoomPosition = useCallback((position: cytoscape.Position) => {
        const cy = cyRef.current;
        if (cy == undefined) {
            return;
        }
        const currentZoom = cy.zoom();
        const newPosition: Position = {
            x: (cy.width() / 2) - (position.x * currentZoom),
            y: (cy.height() / 2) - (position.y * currentZoom),
        }
        cy.pan(newPosition);
    }, [cyRef]);

    const onZoomWayPoint = useCallback((waypoint: WayPoint) => {
        onZoomPosition(waypoint.position);
    }, [onZoomPosition]);

    const onEditWayPoint = useCallback((waypoint: WayPoint) => {
        console.log(`Edit waypoint: ${waypoint.data.label}`)
        setEditRow(waypoint);
        setOpenEditDialog(true);
    }, [setEditRow, setOpenEditDialog]);

    // This useEffect will now handle clearing source/destination if waypoints shrink
    useEffect(() => {
        if (waypoints.length <= 2) {
            setSourceNode(undefined);
            setDestinationNode(undefined);
        }
    }, [waypoints]); // Only re-run if waypoints array reference changes

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
            const id = evt.target.id();
            console.log("Edit: " + id)
            const node = waypoints.find(x => x.data.id === id);
            if(node) {
                onEditWayPoint(node);
            } else {
                console.error({type: "Node not found", id});
            }
        })
        cy.on('select', 'edge', function (evt) { // Or 'click' for desktop
            const edge = evt.target;
            console.log({
                event: 'select edge',
                nodeid: edge.id(),
                nodedata: edge.data(),
            });
        });
        cy.on('pan', (e) => { console.log(e.position)})
    }, [waypoints, onEditWayPoint]);

    return (
        <div>
            <h3>WayPoints</h3>
            <CytoscapeComponent
                elements={elements}
                stylesheet={stylesheet}
                minZoom={0.5}
                maxZoom={2}
                boxSelectionEnabled={false} // Disable box selection for cleaner interaction
                wheelSensitivity={0.5} // Adjust zoom sensitivity
                autolock={true}
                cy={cyFunction}
            />

            {/* Action Buttons */}
            <h4>WayPoint Actions</h4>
            <WayPointActiveButtons
                waypoints={waypoints}
                setWaypoints={setWayPoints}
                sourceNode={sourceNode}
                destinationNode={destinationNode}
                onZoomPosition={onZoomPosition}
            />
            <h4>WayPoint Path</h4>
            <PathStepsTable 
                pathSteps={pathSteps}
                onZoomNode={onZoomNode}
                sourceNode={sourceNode}
                destinationNode={destinationNode}            
            />
            <h4>WayPoint Table</h4>
            <WayPointsDataGrid
                sourceNode={sourceNode}
                destinationNode={destinationNode}
                rows={waypoints}
                onZoom={onZoomWayPoint}
                setSourceNode={setSourceNode}
                setDestinationNode={setDestinationNode}
                handleOpenEditDialog={onEditWayPoint}
            />        
            <WayPointEditDialog
                open={openEditDialog}
                setOpen={setOpenEditDialog}
                rows={waypoints}
                setRows={setWayPoints}
                editRow={editRow}
                setEditRow={setEditRow} // TODO: Move set source / dest into dialog?
                setSourceNode={setSourceNode}
                setDestinationNode={setDestinationNode}
                onZoomWayPoint={onZoomWayPoint}
            />
        </div>
    );
}