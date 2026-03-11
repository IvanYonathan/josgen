"use client"

import * as React from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    Pie,
    PieChart,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts"

import { cn } from "@/lib/utils"

// Chart colors
export const CHART_COLORS = {
    income: "#22c55e",     
    expense: "#ef4444",    
    primary: "#3b82f6",    
    secondary: "#8b5cf6",  
    muted: "#6b7280",      
    approved: "#22c55e",
    pending: "#eab308",    
    rejected: "#ef4444",
} as const

// Default pie chart colors
export const PIE_COLORS = [
    "#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6",
    "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#84cc16",
]

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function ChartContainer({ children, className, ...props }: ChartContainerProps) {
    return (
        <div className={cn("w-full", className)} {...props}>
            <ResponsiveContainer width="100%" height="100%">
                {children as React.ReactElement}
            </ResponsiveContainer>
        </div>
    )
}

interface ChartTooltipContentProps {
    active?: boolean
    payload?: Array<{ color: string; name: string; value: number }>
    label?: string
    formatter?: (value: number) => string
}

export function ChartTooltipContent({
    active,
    payload,
    label,
    formatter = (value) => `Rp${Math.abs(value).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}: ChartTooltipContentProps) {
    if (!active || !payload?.length) return null

    return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
            {label && <p className="font-medium text-sm mb-2">{label}</p>}
            <div className="space-y-1">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium">{formatter(entry.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Bar chart for monthly data
interface MonthlyBarChartProps {
    data: Array<{
        month: string
        income?: number
        expense?: number
        approved?: number
        pending?: number
        [key: string]: string | number | undefined
    }>
    dataKeys?: { key: string; color: string; label: string }[]
    height?: number | string
}

export function MonthlyBarChart({
    data,
    dataKeys = [
        { key: 'income', color: CHART_COLORS.income, label: 'Income' },
        { key: 'expense', color: CHART_COLORS.expense, label: 'Expense' },
    ],
    height = 300
}: MonthlyBarChartProps) {
    return (
        <ChartContainer className={`h-[${height}px]`} style={{ height }}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                {dataKeys.map((dk) => (
                    <Bar
                        key={dk.key}
                        dataKey={dk.key}
                        name={dk.label}
                        fill={dk.color}
                        radius={[4, 4, 0, 0]}
                    />
                ))}
            </BarChart>
        </ChartContainer>
    )
}

// Pie chart for category breakdown
interface CategoryPieChartProps {
    data: Array<{
        name: string
        value: number
        color?: string
    }>
    height?: number | string
}

export function CategoryPieChart({ data, height = 300 }: CategoryPieChartProps) {
    return (
        <ChartContainer className={`h-[${height}px]`} style={{ height }}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
        </ChartContainer>
    )
}

// Line chart for trends
interface TrendLineChartProps {
    data: Array<{
        month: string
        [key: string]: string | number | undefined
    }>
    dataKeys?: { key: string; color: string; label: string }[]
    height?: number | string
}

export function TrendLineChart({
    data,
    dataKeys = [
        { key: 'balance', color: CHART_COLORS.primary, label: 'Balance' },
    ],
    height = 300
}: TrendLineChartProps) {
    return (
        <ChartContainer className={`h-[${height}px]`} style={{ height }}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                {dataKeys.map((dk) => (
                    <Line
                        key={dk.key}
                        type="monotone"
                        dataKey={dk.key}
                        name={dk.label}
                        stroke={dk.color}
                        strokeWidth={2}
                        dot={{ fill: dk.color, strokeWidth: 2 }}
                    />
                ))}
            </LineChart>
        </ChartContainer>
    )
}

export {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    Pie,
    PieChart,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
}
