'use client';

import { TradeListElement, TradeListElementList, TraderList, VsServer } from "@/utils/schema";
import { useMemo, useState } from "react";

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
                if(result != undefined) {
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

    const [itemNameFriendly, setItemNameFriendly] = useState<boolean>(true);
    const [itemNameFilter, setItemNameFilter] = useState<string>("");
    const [traderTypeFilter, setTraderTypeFilter] = useState<"" | "trader" | "villager">("trader");
    const [traderNameFriendly, setTraderNameFriendly] = useState<boolean>(true);
    const [traderNameFilter, setTraderNameFilter] = useState<string>("");
    const [tradeTypeFilter, setTradeTypeFilter] = useState<"" | "selling" | "buying">("");

    const [trades, itemNames, traderNames] = useMemo(() => {
        const trades: Trade[] = [];
        const itemNames = new Set<string>();
        const traderNames = new Set<string>();

        tradelists.forEach(trader => {
            function processList(e: TradeListElementList, tradeType: TradeType) {
                e.list.forEach(trade => {
                    const [traderName, traderNameError] = determineTraderName({
                        vsServer,
                        langLut,
                        trader,
                    });

                    const [itemName, nameError] = determineItemName({
                        vsServer,
                        langLut,
                        trade,
                    });
                    itemNames.add(itemName);
                    traderNames.add(traderName);
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

        return [
            trades.filter(x => {
                if (tradeTypeFilter.length !== 0) {
                    if (x.type !== tradeTypeFilter) {
                        return false;
                    }
                }

                if (traderTypeFilter.length !== 0) {
                    if (x.traderType !== traderTypeFilter) {
                        return false;
                    }
                }

                if (itemNameFilter.length !== 0) {
                    if (!x.name.toLowerCase().includes(itemNameFilter.toLowerCase())) {
                        return false;
                    }
                }

                if (traderNameFilter.length !== 0) {
                    if (!x.traderName.toLowerCase().includes(traderNameFilter.toLowerCase())) {
                        return false;
                    }
                }

                return true;
            }),
            Array.from(itemNames),
            Array.from(traderNames),
        ];
    }, [
        vsServer,
        langLut,
        tradelists,
        itemNameFilter,
        traderNameFilter,
        tradeTypeFilter,
        traderTypeFilter,
    ]);

    if (langLut == undefined) {
        return <p>Given Language Code doesn&lsquo;t exist {lang}.</p>
    }

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Trader Type</th>
                        <th>Trader Name</th>
                        <th>Buying / Selling</th>
                        <th>Stack Size</th>
                        <th>Cost Min</th>
                        <th>Cost Max</th>
                    </tr>
                    <tr>
                        <th>
                            <input list="itemNames" name="itemNames" value={itemNameFilter} onChange={x => setItemNameFilter(x.target.value)} />
                            <datalist id="itemNames">
                                {itemNames.map((x, index) => (
                                    <option key={index} value={x}>{x}</option>)
                                )}
                            </datalist>
                            <button onClick={() => setItemNameFriendly(!itemNameFriendly)}>{itemNameFriendly ? "🫣" : "👀"}</button>
                        </th>
                        <th>
                            <select name="traderType" value={traderTypeFilter} onChange={x => {
                                if (x.target.value === "" || x.target.value === "trader" || x.target.value === "villager") {
                                    setTraderTypeFilter(x.target.value)
                                }
                            }}>
                                <option value=""></option>
                                <option value="trader">trader</option>
                                <option value="villager">villager</option>
                            </select>
                        </th>
                        <th>
                            <input list="traderNames" name="traderNames" value={traderNameFilter} onChange={x => setTraderNameFilter(x.target.value)} />
                            <datalist id="traderNames">
                                {traderNames.map((x, index) => (
                                    <option key={index} value={x}>{x}</option>)
                                )}
                            </datalist>
                            <button onClick={() => setTraderNameFriendly(!traderNameFriendly)}>{traderNameFriendly ? "🫣" : "👀"}</button>
                        </th>
                        <th>
                            <select name="TradeType" value={tradeTypeFilter} onChange={x => {
                                if (x.target.value === "" || x.target.value === "selling" || x.target.value === "buying") {
                                    setTradeTypeFilter(x.target.value);
                                }
                            }}>
                                <option value=""></option>
                                <option value="selling">selling</option>
                                <option value="buying">buying</option>
                            </select>
                        </th>
                        <th></th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {trades.map((trade, index) => (
                        <tr key={index}>
                            <td style={{ color: trade.nameError ? "red" : undefined }}>
                                {itemNameFriendly ? trade.name : trade.code} {trade.nameError && "*"}
                            </td>
                            <td>{trade.traderType}</td>
                            <td style={{ color: trade.traderNameError ? "red" : undefined }}>
                                {traderNameFriendly ? trade.traderName : trade.traderCode} {trade.traderNameError && "*"}
                            </td>
                            <td>{trade.type}</td>
                            <td>{trade.stacksize}</td>
                            <td>{trade.min}</td>
                            <td>{trade.max}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>

    )
}