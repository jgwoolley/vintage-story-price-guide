'use client';

import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import { stringifyWayPoint, WayPoint } from "./utils";

type WayPointsDataGridProps = {
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>
    rows: WayPoint[],
    setRows: Dispatch<SetStateAction<WayPoint[]>>,
    editRow: WayPoint,
    setEditRow: Dispatch<SetStateAction<WayPoint>>,
}

export default function WayPointEditDialog({ rows, setRows, open, setOpen, editRow, setEditRow }: WayPointsDataGridProps) {
    const handleClose = () => {
        setOpen(false);
    };

    const handleDelete = () => {
        handleClose();
        setRows(prev => prev.filter(prevRow => prevRow.data.id !== editRow.data.id));
    }

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault(); 
        handleClose();
        setRows(prev => prev.map(prevRow => prevRow.data.id === editRow.data.id ? editRow: prevRow));
    };

    return (
        <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Edit Waypoint</DialogTitle>
                <DialogContent sx={{ paddingBottom: 0 }}>
                    <DialogContentText>
                        Please update the waypoint details below.
                    </DialogContentText>
                    <Box
                    onSubmit={onSubmit}
                        component="form"
                        sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
                        noValidate
                        autoComplete="off"
                        >
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
                                if(value == undefined || isNaN(value)) {
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
                                if(value == undefined || isNaN(value)) {
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
                                if(value == undefined || isNaN(value)) {
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
                        <Autocomplete
                            disablePortal
                            options={rows}
                            getOptionLabel={x => stringifyWayPoint(x)}
                            sx={{ width: 300 }}
                            value={ editRow.connection ? editRow.connection: null }
                            onChange={(_, newValue) => {
                                if(newValue != undefined) {
                                    editRow.connection = newValue;
                                    newValue.connection = editRow;
                                }
                            } }
                            renderInput={(params) => <TextField {...params} label="Connection" />}
                        />

                        <DialogActions>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleDelete}>Remove</Button>
                            <Button type="submit">Submit</Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>
    )
}