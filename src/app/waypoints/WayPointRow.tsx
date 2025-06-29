'use client';

import { Dispatch, SetStateAction } from "react";
import { WayPoint } from "./utils";
import WayPointSelection from "./WayPointSelection";

export type WayPointRowProps = {
    row: WayPoint,
    editRow: number,
    setEditRow: Dispatch<SetStateAction<number>>,
    index: number,
    waypoints: WayPoint[],
    setWaypoints: Dispatch<SetStateAction<WayPoint[]>>
    splitWaypoints: (start: number, deleteCount?: number) => WayPoint[],
    onZoom: (waypoint: WayPoint) => void,
    setSourceNode: (waypoint: WayPoint) => void,
    setDestinationNode: (waypoint: WayPoint) => void,
}

export default function WayPointRow({ 
    waypoints, 
    setWaypoints, 
    row, 
    index, 
    splitWaypoints, 
    editRow, 
    setEditRow, 
    onZoom,
    setSourceNode,
    setDestinationNode,
}: WayPointRowProps) {
    if (editRow === index) {
        return (
            <tr>
                <td>
                    <input value={row.name} onChange={(e) => {
                        row.name = e.target.value;
                        setWaypoints([...waypoints]);
                    }} />
                </td>
                <td>
                    <input value={row.x} onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if(value == undefined || isNaN(value)) {
                            return;
                        }
                        row.x = value;
                        setWaypoints([...waypoints]);
                    }} />
                </td>
                <td>
                    <input value={row.y} onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if(value == undefined || isNaN(value)) {
                            return;
                        }
                        row.y = value;
                        setWaypoints([...waypoints]);
                    }} />
                </td>
                <td>
                    <input value={row.z} onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if(value == undefined || isNaN(value)) {
                            return;
                        }
                        row.z = value;
                        setWaypoints([...waypoints]);
                    }} />
                </td>
                <td>
                    <WayPointSelection
                        name="destinationNode"
                        id="destinationNode"
                        node={row.connection}
                        setNode={(value) => {
                            row.connection = value;
                            setWaypoints([...waypoints]);
                        }}
                        waypoints={waypoints}
                        emptyValid={true}
                    />

                </td>
                <td>
                    <button onClick={() => splitWaypoints(index, 1)}>remove</button>
                    <button onClick={() => setEditRow(-1)}>save</button>
                </td>
            </tr>
        )
    }

    return (
        <tr>
            <td>{row.name}</td>
            <td>{row.x}</td>
            <td>{row.y}</td>
            <td>{row.z}</td>
            <td>{row.connection?.name}</td>
            <td>
                <button onClick={() => setEditRow(index)}>edit</button>
                <button onClick={() => onZoom(row)}>zoom</button>
                <button onClick={() => {
                    setSourceNode(row);
                    onZoom(row);
                }}>set source</button>
                <button onClick={() => {
                    setDestinationNode(row);
                    onZoom(row);
                }}>set destination</button>
            </td>
        </tr>
    )
}