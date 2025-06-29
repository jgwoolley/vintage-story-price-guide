'use client';

import { downloadFile } from "@/utils/downloadFile";
import { ChangeEventHandler, Dispatch, MouseEventHandler, PropsWithChildren, SetStateAction, useCallback, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import { useMemo } from "react";
import { useEffect } from "react";
import { calculateDistance, deserializeWayPoints, serializeWayPoints, WayPoint, WayPointJsonsSchema } from "./utils";
import WayPointSelection from "./WayPointSelection";

type WayPointRowProps = {
    row: WayPoint,
    editRow: number,
    setEditRow: Dispatch<SetStateAction<number>>,
    index: number,
    waypoints: WayPoint[],
    setWaypoints: Dispatch<SetStateAction<WayPoint[]>>
    splitWaypoints: (start: number, deleteCount?: number) => WayPoint[],
}

function WayPointRow({ waypoints, setWaypoints, row, index, splitWaypoints, editRow, setEditRow }: WayPointRowProps) {
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
                        row.x = parseInt(e.target.value);
                        setWaypoints([...waypoints]);
                    }} />
                </td>
                <td>
                    <input value={row.y} onChange={(e) => {
                        row.y = parseInt(e.target.value);
                        setWaypoints([...waypoints]);
                    }} />
                </td>
                <td>
                    <input value={row.z} onChange={(e) => {
                        row.z = parseInt(e.target.value);
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
                <button onClick={() => splitWaypoints(index, 1)}>remove</button>
                <button onClick={() => setEditRow(index)}>edit</button>
            </td>
        </tr>
    )
}

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

const layout: cytoscape.LayoutOptions = {
    name: "concentric",
    animate: false,
    minNodeSpacing: 3,
    spacingFactor: 3.4,
};

const stylesheet: cytoscape.StylesheetJson = [
    {
        selector: "node[type=\"waypoint\"]",
        style: {
            shape: "rectangle",
        }
    },
    {
        selector: "node",
        style: {
            "label": "data(name)",
            "color": "black",
            "background-color": "red",
            "font-weight": "bold",
        }
    },
   {
    selector: 'edge[weight != 0]', // Selects edges where the 'weight' property is not equal to 0
    style: {
      'display': 'none' // Hides the selected edges
    }
  },
];

export default function WayPointComponent() {
    const [waypoints, setWaypoints] = useState<WayPoint[]>([]);
    const [sourceNode, setSourceNode] = useState<WayPoint | undefined>(waypoints.length > 0 ? waypoints[0] : undefined);
    const [destinationNode, setDestinationNode] = useState<WayPoint | undefined>(waypoints.length > 0 ? waypoints[0] : undefined);
    const [editRow, setEditRow] = useState<number>(-1);

    const splitWaypoints = useCallback((start: number, deleteCount?: number) => {
        setEditRow(-1);
        const results = waypoints.splice(start, deleteCount)

        results.forEach(row => {
            if (row == sourceNode) {
                setSourceNode(undefined);
            }
            if (row == destinationNode) {
                setDestinationNode(undefined);
            }
        });

        setWaypoints([...waypoints]);
        return results;
    }, [waypoints, destinationNode, sourceNode]);

    const elements = useMemo<cytoscape.ElementDefinition[]>(() => {
        const results: cytoscape.ElementDefinition[] = [];
        const edges = new Set<string>();
        for (const source of waypoints) {
            // WayPoint Nodes
            results.push({
                position: {
                    x: source.x,
                    y: source.z,
                },
                data: {
                    name: source.name,
                    id: source.id,
                },
            });

            // TODO: Each edge is duplicated...
            for (const destination of waypoints) {
                if(source.id === destination.id) {
                    continue;
                }

                const weight = calculateDistance({
                    source: source,
                    destination: destination,
                });
                edges.add(`${source.id}\t${destination.id}\t${weight}`);
            }

            if (source.connection) {
                results.push({
                    data: {
                        source: source.id,
                        target: source.connection?.id,
                        weight: 0,
                    },
                })
            }
        }

        edges.forEach(rawEdge => {
            const [source, target, rawWeight] = rawEdge.split("\t");
            results.push({
                data: {
                    source: source,
                    target: target,
                    weight: parseFloat(rawWeight),
                },
            })
        });

        return results;
    }, [waypoints]);

    const cyRef = useRef<cytoscape.Core>(null);

useEffect(() => {
    if (cyRef.current && sourceNode && destinationNode) {
      const cy = cyRef.current;

      // Example: Find shortest path from 'a' to 'f'
      const startNodeId = 'a';
      const endNodeId = 'f';

      // Remove any previous shortest-path classes
      cy.elements().removeClass('shortest-path');

      const dijkstra = cy.elements().dijkstra({
        root: sourceNode.id,
      });

      const pathToTarget = dijkstra.pathTo(cy.$(destinationNode.id));
      const distance = dijkstra.distanceTo(cy.$(destinationNode.id));

      if (pathToTarget.length > 0) {
        console.log(`Shortest path from ${startNodeId} to ${endNodeId}:`, pathToTarget.map(el => el.id()));
        console.log(`Distance:`, distance);

        // Add the 'shortest-path' class to all elements in the path
        pathToTarget.addClass('shortest-path');

        // Optional: Fit the view to only the shortest path elements
        // This makes sure the path is centered and zoomed appropriately
        cy.fit(pathToTarget, 50); // Add 50px padding
      } else {
        console.log(`No path found from ${startNodeId} to ${endNodeId}.`);
      }
    }
  }, [ sourceNode, destinationNode ]);

    return (
        <>
            <h3>WayPoints</h3>
            <table>
                <thead>
                    <tr>
                        <th>waypoint</th>
                        <th>x</th>
                        <th>y</th>
                        <th>z</th>
                        <th>connection</th>
                        <th>edit</th>
                    </tr>
                </thead>
                <tbody>
                    {waypoints.map((row, index) => (
                        <WayPointRow
                            key={index}
                            row={row}
                            index={index}
                            splitWaypoints={splitWaypoints}
                            editRow={editRow}
                            setEditRow={setEditRow}
                            waypoints={waypoints}
                            setWaypoints={setWaypoints}
                        />
                    ))}
                </tbody>
            </table>
            <br />
            <FileUploader handleFiles={async (files) => {
                for (const file of files) {
                    const data: unknown = JSON.parse(await file.text());
                    const result = WayPointJsonsSchema.safeParse(data);
                    if (result.success) {
                        const newWaypoints = deserializeWayPoints(result.data);
                        setWaypoints([...waypoints, ...newWaypoints]);
                    }
                }
            }}>Upload File</FileUploader>
            <button onClick={() => {
                setWaypoints([...waypoints, { id: `${waypoints.length}`, name: "", x: 0, y: 0, z: 0 }]);
                setEditRow(waypoints.length);
            }}>Add Row</button>
            <button onClick={() => {
                const results = serializeWayPoints(waypoints);
                downloadFile(new File([JSON.stringify(results)], "waypoints.json"));
                console.log(results);
            }}>Download File</button>
            <CytoscapeComponent
                elements={elements}
                layout={layout}
                stylesheet={stylesheet}
                autolock={true}
                style={{ height: "80vh", border: "solid black" }}
                wheelSensitivity = {2.5}
                cy={(cy) => { cyRef.current = cy }}
            />
        </>
    )
}