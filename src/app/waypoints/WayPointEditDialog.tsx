'use client';

import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { Dispatch, SetStateAction, useCallback, useContext } from "react";
import { getWaypointCommand, stringifyWayPoint, WayPoint } from "./utils";
import { SubmitSnackbarContext } from "@/components/SnackbarProvider";

type WayPointsDataGridProps = {
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>
    rows: WayPoint[],
    setRows: Dispatch<SetStateAction<WayPoint[]>>,
    editRow: WayPoint,
    setEditRow: Dispatch<SetStateAction<WayPoint>>,
    setSourceNode: Dispatch<SetStateAction<WayPoint | undefined>>,
    setDestinationNode: Dispatch<SetStateAction<WayPoint | undefined>>,
    onZoomWayPoint: (waypoint: WayPoint) => void,
}

export default function WayPointEditDialog({ rows, setRows, open, setOpen, editRow, setEditRow, setSourceNode, setDestinationNode, onZoomWayPoint }: WayPointsDataGridProps) {
    const submitMessage = useContext(SubmitSnackbarContext);
    
    const handleClose = () => {
        setOpen(false);
    };

    const handleDelete = () => {
        handleClose();
        setRows(prev => prev.filter(prevRow => prevRow.data.id !== editRow.data.id));
    }

    const onSubmit = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        setRows(prev => {
            const results = prev.map(prevRow => prevRow.data.id === editRow.data.id ? editRow : prevRow);
            submitMessage("Submitted Changes", "success", results);
            handleClose();
            return results;
        });
    }, [setRows]);

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Edit Waypoint</DialogTitle>
            <DialogContent sx={{ paddingBottom: 0 }}>
                <DialogContentText>
                    Please update the waypoint details below.
                </DialogContentText>
                <Box
                    component="form"
                    sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
                    noValidate
                    autoComplete="off"
                >
                    <TextField
                        margin="dense"
                        id="name"
                        label="id"
                        type="text"
                        fullWidth
                        variant="standard"
                        disabled={true}
                        value={editRow.data.id}
                    />
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="name"
                        label="Waypoint"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={editRow.data.label}
                        onChange={(x) => {
                            setEditRow(prev => {
                                const newRow: WayPoint = {
                                    ...prev,
                                };
                                newRow.data.label = x.target.value;
                                return newRow;
                            });
                        }}
                    />
                    <TextField
                        required
                        id="x"
                        label="x"
                        type="number"
                        variant="standard"
                        value={editRow.position.x}
                        onChange={(x) => {
                            const value = x.target.value.length === 0 ? 0 : parseFloat(x.target.value);
                            if (value == undefined || isNaN(value)) {
                                return;
                            }

                            setEditRow(prev => {
                                const newRow: WayPoint = {
                                    ...prev,
                                };
                                newRow.position.x = value;
                                return newRow;
                            });
                        }}
                    />
                    <TextField
                        required
                        id="y"
                        label="y"
                        variant="standard"
                        type="number"
                        value={editRow.data.height}
                        onChange={(x) => {
                            const value = x.target.value.length === 0 ? 0 : parseFloat(x.target.value);
                            if (value == undefined || isNaN(value)) {
                                return;
                            }
                            setEditRow(prev => {
                                const newRow: WayPoint = {
                                    ...prev,
                                };
                                newRow.data.height = value;
                                return newRow;
                            });
                        }}
                    />
                    <TextField
                        required
                        id="z"
                        label="z"
                        variant="standard"
                        type="number"
                        value={editRow.position.y}
                        onChange={(x) => {
                            const value = x.target.value.length === 0 ? 0 : parseFloat(x.target.value);
                            if (value == undefined || isNaN(value)) {
                                return;
                            }
                            setEditRow(prev => {
                                const newRow: WayPoint = {
                                    ...prev,
                                };
                                newRow.position.y = value;
                                return newRow;
                            });
                        }}
                    />
                    <TextField
                        margin="dense"
                        id="origin"
                        label="Origin"
                        type="text"
                        fullWidth
                        variant="standard"
                        disabled={true}
                        value={editRow.data.origin}
                    />
                    <TextField
                        margin="dense"
                        id="createdTime"
                        label="Created Time"
                        type="text"
                        fullWidth
                        variant="standard"
                        disabled={true}
                        value={editRow.data.createdTime}
                    />
                    <TextField
                        margin="dense"
                        id="modifiedTime"
                        label="Modified Time"
                        type="text"
                        fullWidth
                        variant="standard"
                        disabled={true}
                        value={editRow.data.modifiedTime}
                    />
                    <Autocomplete
                        disablePortal
                        options={rows}
                        getOptionLabel={x => stringifyWayPoint(x)}
                        sx={{ width: 300 }}
                        value={editRow.connection ? editRow.connection : null}
                        onChange={(_, newValue) => {
                            // TODO: This doesn't seem to work...
                            if (newValue != undefined) {
                                editRow.connection = newValue;
                                newValue.connection = editRow;
                            }
                        }}
                        renderInput={(params) => <TextField {...params} label="Connection" />}
                    />
                </Box>
                <Box>

                    <Button onClick={() => setSourceNode(editRow)}>set Source</Button>
                    <Button onClick={() => setDestinationNode(editRow)}>set Destination</Button>
                    <Button onClick={() => onZoomWayPoint(editRow)}>Zoom</Button>
                    <Button onClick={async () => {
                        const command = getWaypointCommand(editRow);
                        await navigator.clipboard.writeText(command);
                    }}>Get Command</Button>
                </Box>
                <DialogActions
                    sx={{
                        flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on extra-small screens, row on small and up
                        '& > button': {
                            width: { xs: '100%', sm: 'auto' }, // Make buttons full width on extra-small
                            mb: { xs: 1, sm: 0 }, // Add bottom margin to stacked buttons
                        },
                        justifyContent: 'flex-end', // Keep buttons aligned to the end
                    }}
                >
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleDelete}>Remove</Button>
                    <Button onClick={(e)=> {onSubmit(e)}} type="submit">Submit</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}