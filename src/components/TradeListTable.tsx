'use client';

import { TradeListElement, TradeListElementList, TraderList, VsServer } from "@/utils/schema";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";

export type TradeListTableProps = {
    lang: string,
    vsServer: VsServer,
}

type TradeType = "selling" | "buying";

type Trade = {
    traderType: string,
    traderName: string,
    traderNameError: boolean,
    traderCode: string,
    type: TradeType,
    code: string,
    name: string,
    nameError: boolean,
    stacksize: number,
    min: number,
    max: number,
}

function determineTraderName({ langLut, trader }: { vsServer: VsServer, langLut?: Record<string, string>, trader: TraderList }): [string, boolean] {
    if (langLut == undefined) {
        return [trader.traderCode, false];
    }

    let traderLuv: string | null = null;
    if (trader.traderType === "villager") {
        traderLuv = `nametag-${trader.traderCode}`;
    } else if (trader.traderType === "trader") {
        let traderCode = trader.traderCode;
        if (trader.traderCode === "agriculture") {
            traderCode = "foods";
        }
        traderLuv = `item-creature-humanoid-trader-${traderCode}`;
    }

    if (traderLuv == undefined) {
        return [trader.traderCode, true];
    }

    const result = langLut[traderLuv];
    if (result == undefined) {
        return [trader.traderCode, true];
    }

    return [result, false];
}

function determineItemName({ langLut, trade }: { vsServer: VsServer, langLut?: Record<string, string>, trade: TradeListElement }): [string, boolean] {
    if (langLut == undefined) {
        return [trade.code, true];
    }

    const itemLuv = `${trade.type}-${trade.code}`;

    const result = langLut[itemLuv];
    if (result == undefined) {
        // TODO: Test
        for (const key of Object.keys(langLut)) {
            if (key.endsWith("*") && trade.code.startsWith(key.substring(0, key.length - 1))) {
                const result = langLut[itemLuv];
                if (result != undefined) {
                    return [result, false];
                }
            }
        }
        return [trade.code, true];
    }

    return [result, false];
}

export default function TradeListTable({ lang, vsServer }: TradeListTableProps) {
    const { tradelists } = vsServer.assets.survival.config;
    const langLut = vsServer.assets.game.lang.lut.get(lang);

    const [ 
        trades, 
        // traderNames 
    ] = useMemo(() => {
        const trades: Trade[] = [];
        const traderNames = new Set<string>();

        tradelists.forEach(trader => {
            function processList(e: TradeListElementList, tradeType: TradeType) {
                e.list.forEach(trade => {
                    const [traderName, traderNameError] = determineTraderName({
                        vsServer,
                        langLut,
                        trader,
                    });
                    traderNames.add(traderName);

                    const [itemName, nameError] = determineItemName({
                        vsServer,
                        langLut,
                        trade,
                    });
                    trades.push({
                        traderName: traderName,
                        traderNameError: traderNameError,
                        traderType: trader.traderType,
                        traderCode: trader.traderCode,
                        name: itemName,
                        nameError: nameError,
                        type: tradeType,
                        stacksize: trade.stacksize,
                        min: trade.price.avg - trade.price.var,
                        max: trade.price.avg + trade.price.var,
                        code: trade.code,
                    });
                });
            }

            processList(trader.buying, "buying");
            processList(trader.selling, "selling");
        })
        trades.sort((a, b) => a.code.localeCompare(b.code));
        return [trades, traderNames];
    }, [
        vsServer,
        langLut,
        tradelists,
    ]);

    const columns = useMemo<GridColDef<Trade>[]>(() => {
        return [
            {
                field: 'code',
                headerName: 'code',
            },
            {
                field: 'name',
                headerName: 'name',
            },
            {
                field: 'traderName',
                headerName: 'traderName',
                // type: "singleSelect",
                // valueOptions: traderNames,
            },
            {
                field: 'traderType',
                headerName: 'traderType',
                type: "singleSelect",
                valueOptions: ["trader", "villager"],
            },
            {
                field: 'type',
                headerName: 'type',
                type: "singleSelect",
                valueOptions: ["selling", "buying"],
            },
            {
                field: 'stacksize',
                headerName: 'stacksize',
            },
            {
                field: 'min',
                headerName: 'min',
            },
            {
                field: 'max',
                headerName: 'max',
            },
            {
                field: 'nameError',
                headerName: 'nameError',
                type: "boolean",
            },
        ];
    }, [
        // traderNames
    ]);

    if (langLut == undefined) {
        return <p>Given Language Code doesn&lsquo;t exist {lang}.</p>
    }

    return (
        <>
            <DataGrid
                columns={columns}
                rows={trades}
                getRowId={x => JSON.stringify(x)}
                initialState={{
                    columns: {
                        columnVisibilityModel: {
                            code: false,
                            nameError: false,
                        }
                    }
                }}
            />
        </>
    )
}