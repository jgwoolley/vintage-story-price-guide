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
    traderCode: string,
    type: TradeType,
    code: string,
    name: string,
    min: number,
    max: number,
}

function determineTraderName({ langLut, trader }: {vsServer: VsServer, langLut?: Record<string, string>, trader: TraderList}): string {
     if(langLut == undefined) {
        return trader.traderCode;
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

    if(traderLuv == undefined) {
        return trader.traderCode;
    }

    return langLut[traderLuv] || trader.traderCode;
}

function determineItemName({ langLut, trade }: {vsServer: VsServer, langLut?: Record<string, string>, trade: TradeListElement}): string {
    if(langLut == undefined) {
        return trade.code;
    }
    
    const itemLuv = `${trade.type}-${trade.code}`;
    return langLut[itemLuv] || trade.code;
}

export default function TradeListTable({ lang, vsServer }: TradeListTableProps) {
    const { tradelists } = vsServer.assets.survival.config;
    const langLut = vsServer.assets.game.lang.lut.get(lang);

    const [itemNameFilter, setItemNameFilter] = useState<string>("");
    const [traderTypeFilter, setTraderTypeFilter] = useState<"" | "trader" | "villager">("trader");
    const [traderNameFilter, setTraderNameFilter] = useState<string>("");
    const [tradeTypeFilter, setTradeTypeFilter] = useState<"" | "selling" | "buying">("");

    const [trades, itemNames, traderNames] = useMemo(() => {
        const trades: Trade[] = [];
        const itemNames = new Set<string>();
        const traderNames = new Set<string>();

        tradelists.forEach(trader => {
            function processList(e: TradeListElementList, tradeType: TradeType) {
                e.list.forEach(trade => {
                    const traderName = determineTraderName({
                        vsServer,
                        langLut, 
                        trader,
                    });

                    const itemName = determineItemName({
                        vsServer, 
                        langLut, 
                        trade,
                    });
                    itemNames.add(itemName);
                    traderNames.add(traderName);
                    trades.push({
                        traderName: traderName,
                        traderType: trader.traderType,
                        traderCode: trader.traderCode,
                        name: itemName,
                        type: tradeType,
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
            trades.filter( x => {
                if(tradeTypeFilter.length !== 0) {
                    if(x.type !== tradeTypeFilter) {
                        return false;
                    }
                }
                
                if(traderTypeFilter.length !== 0) {
                    if(x.traderType !== traderTypeFilter) {
                        return false;
                    }
                }

                if(itemNameFilter.length !== 0) {
                    if(!x.name.toLowerCase().includes(itemNameFilter.toLowerCase())) {
                        return false;
                    }
                }

                if(traderNameFilter.length !== 0) {
                    if(!x.traderName.toLowerCase().includes(traderNameFilter.toLowerCase())) {
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
                        <th>min</th>
                        <th>max</th>
                    </tr>
                    <tr>
                        <th>
                            <input list="itemNames" name="itemNames" value={itemNameFilter} onChange={x => setItemNameFilter(x.target.value)}/>
                            <datalist id="itemNames">
                                {itemNames.map((x, index) => (
                                    <option key={index} value={x}>{x}</option>)
                                )}
                            </datalist>
                        </th>
                        <th>
                            <select name="traderType" value={traderTypeFilter} onChange={x => {
                                if(x.target.value === "" || x.target.value === "trader" || x.target.value === "villager") {
                                    setTraderTypeFilter(x.target.value)
                                }
                            }}>
                                <option value=""></option>
                                <option value="trader">trader</option>
                                <option value="villager">villager</option>
                            </select>
                        </th>
                        <th>
                            <input list="traderNames" name="traderNames" value={traderNameFilter} onChange={x => setTraderNameFilter(x.target.value)}/>
                            <datalist id="traderNames">
                                {traderNames.map((x, index) => (
                                    <option key={index} value={x}>{x}</option>)
                                )}
                            </datalist>
                        </th>
                        <th>
                            <select name="TradeType" value={tradeTypeFilter} onChange={x => {
                                if(x.target.value === "" || x.target.value === "selling" || x.target.value === "buying") {
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
                    </tr>
                </thead>
                <tbody>
                    {trades.map((trade, index) => (
                        <tr key={index}>
                            <td>
                                <abbr title={trade.code}>{trade.name}</abbr>
                            </td>
                            <td>{trade.traderType}</td>
                            <td>
                                <abbr title={trade.traderCode}>{trade.traderName}</abbr>
                            </td>
                            <td>{trade.type}</td>
                            <td>{trade.min}</td>
                            <td>{trade.max}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>

    )
}