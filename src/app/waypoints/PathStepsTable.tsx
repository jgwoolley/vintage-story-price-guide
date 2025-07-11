'use client';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import cytoscape from "cytoscape";
import { calculateDistance, PathStep, WayPoint } from "./utils";

export type PathStepsTableProps = {
 pathSteps: PathStep[],
 onZoomNode: (eles?: cytoscape.CollectionArgument, padding?: number) => void,
 sourceNode: WayPoint | undefined, 
 destinationNode: WayPoint | undefined,
}

export default function PathStepsTable({pathSteps, onZoomNode, sourceNode, destinationNode}: PathStepsTableProps) {
    if(sourceNode == undefined || destinationNode == undefined) {
        return "No Path to display.";
    }

    return (
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
                        <TableCell sx={{ cursor: "pointer" }} onClick={() => onZoomNode(x.from)}>{x.from.data("label")}</TableCell>
                        <TableCell sx={{ cursor: "pointer" }} onClick={() => onZoomNode(x.to)}>{x.to.data("label")}</TableCell>
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
    )
}