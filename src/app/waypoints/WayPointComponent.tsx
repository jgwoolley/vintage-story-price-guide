'use client';

import CytoscapeComponent from "@/components/CytoscapeComponent";
import { Box, Tab, Tabs } from "@mui/material";
import cytoscape from "cytoscape";
import { PropsWithChildren, useCallback, useRef, useState } from "react";
import PathStepsTable from "./PathStepsTable";
import useWayPointEdges from "./useWayPointEdges";
import { useWayPointGraph } from "./useWayPointGraph";
import useWayPointStylesheet from "./useWayPointStylesheet";
import { PathStep, WayPoint } from "./utils";
import WayPointActiveButtons from "./WayPointActiveButtons";
import WayPointEditDialog from "./WayPointEditDialog";
import WayPointsDataGrid from "./WayPointsDataGrid";

function CustomTabPanel({ children, currentTab, index }: PropsWithChildren<{ currentTab: number, index: number }>) {
    return (
        <div
            role="tabpanel"
            hidden={currentTab !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
        >
            {currentTab === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function WayPointComponent() {
    const [waypoints, setWayPoints] = useState<WayPoint[]>([]);
    // Initialize source/destination to undefined, let useEffect handle initial assignment
    const [sourceNode, setSourceNode] = useState<WayPoint | undefined>(undefined);
    const [destinationNode, setDestinationNode] = useState<WayPoint | undefined>(undefined);
    const [pathSteps, setPathSteps] = useState<PathStep[]>([]); // New state for path details
    const cyRef = useRef<cytoscape.Core | null>(null); // Ref to hold the Cytoscape instance

    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editRow, setEditRow] = useState<WayPoint>({ position: { x: 0, y: 0 }, data: { id: "", label: "", height: 0, createdTime: new Date(), modifiedTime: new Date(), origin: "browser" } });
    const onZoomNode = (eles?: cytoscape.CollectionArgument, padding?: number) => {
        const cy = cyRef.current;
        if (cy == undefined) {
            return;
        }
        cy.fit(eles, padding);
    };

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
            const node = waypoints.find(x => x.data.id === evt.target.id());
            if(node) {
                handleOpenEditDialog(node);
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
    }, []);

    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <div >
            <h3>WayPoints</h3>
            <CytoscapeComponent
                elements={elements}
                stylesheet={stylesheet}
                minZoom={0.5}
                maxZoom={2}
                boxSelectionEnabled={false} // Disable box selection for cleaner interaction
                wheelSensitivity={0.5} // Adjust zoom sensitivity
                className="w-full" // Ensure it takes full width
                autolock={true}
                cy={cyFunction}
                style={{
                    border: "solid #ddd",
                    height: "50vh",
                    width: "50vw",
                }} 
            />

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
            <h3>WayPoint Management</h3>

            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="waypoint tabs">
                        <Tab label="Table" {...a11yProps(0)} />
                        <Tab label="Path" {...a11yProps(1)} />
                    </Tabs>
                </Box>
                <CustomTabPanel currentTab={currentTab} index={0}>
                    <WayPointsDataGrid
                        sourceNode={sourceNode}
                        destinationNode={destinationNode}
                        rows={waypoints}
                        onZoom={onZoom}
                        setSourceNode={setSourceNode}
                        setDestinationNode={setDestinationNode}
                        handleOpenEditDialog={handleOpenEditDialog}
                    />
                </CustomTabPanel>
                <CustomTabPanel currentTab={currentTab} index={1}>
                    <PathStepsTable 
                        pathSteps={pathSteps}
                        onZoomNode={onZoomNode}
                        sourceNode={sourceNode}
                        destinationNode={destinationNode}            
                    />
                </CustomTabPanel>

            </Box>
        
            <WayPointEditDialog
                open={openEditDialog}
                setOpen={setOpenEditDialog}
                rows={waypoints}
                setRows={setWayPoints}
                editRow={editRow}
                setEditRow={setEditRow} // TODO: Move set source / dest into dialog?
            />
        </div>
    );
}