'use client';

import useCytoscape, { UseCytoscapeParams } from "@/hooks/useCytoscape";
import { CSSProperties, useRef } from "react";

export type CytoscapeComponent = { 
    className?: string | undefined,
    style?: CSSProperties | undefined,
} & Omit<UseCytoscapeParams, "container">;

export default function CytoscapeComponent(props: CytoscapeComponent) {
    const ref = useRef<HTMLDivElement>(null);
    useCytoscape({
        ...props,
        container: ref,
    });

    return (
        <div ref={ref} className={props.className} style={props.style}></div>
    )
}