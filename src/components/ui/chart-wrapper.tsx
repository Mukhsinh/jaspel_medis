"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartWrapperProps {
    options: any;
    series: any[];
    type: "line" | "area" | "bar" | "pie" | "donut" | "radialBar" | "scatter" | "bubble" | "heatmap" | "candlestick" | "boxPlot" | "radar" | "polarArea" | "rangeBar" | "rangeArea" | "treemap";
    height?: string | number;
    width?: string | number;
}

export function ChartWrapper({ options, series, type, height = "100%", width = "100%" }: ChartWrapperProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) {
        return <div style={{ height, width }} className="animate-pulse bg-slate-50 rounded-lg" />;
    }

    // Force animation disable if still crashing, but let's try with stable options first
    const safeOptions = {
        ...options,
        chart: {
            ...options.chart,
            animations: {
                enabled: options.chart?.animations?.enabled ?? false, // Defaulting to false to avoid the specific error
                animateGradually: {
                    enabled: false
                },
                dynamicAnimation: {
                    enabled: false
                }
            }
        }
    };

    return (
        <ReactApexChart
            options={safeOptions}
            series={series}
            type={type}
            height={height}
            width={width}
        />
    );
}
