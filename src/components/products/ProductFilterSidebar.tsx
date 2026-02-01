"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface ProductFilterSidebarProps {
    isOpen: boolean;
    toggleOpen: () => void;
    categories: Category[];
    filters: {
        search: string;
        category: string;
        priceRange: string;
        color: string;
        duration: string;
    };
    setFilters: (filters: any) => void;
}

// Mock Data for UI Consistency
const COLORS = [
    { name: "Teal", value: "bg-teal-700", id: "teal" },
    { name: "Purple", value: "bg-purple-500", id: "purple" },
    { name: "Brown", value: "bg-amber-800", id: "brown" },
    { name: "Orange", value: "bg-orange-500", id: "orange" },
    { name: "Blue", value: "bg-blue-500", id: "blue" },
    { name: "Black", value: "bg-black", id: "black" },
];

const DURATIONS = [
    "1 Month",
    "6 Months",
    "1 Year",
    "2 Years",
    "3 Years",
];

interface DualRangeSliderProps {
    min: number;
    max: number;
    step: number;
    value: [number, number];
    onValueChange: (value: [number, number]) => void;
    onValueCommit: (value: [number, number]) => void;
}

function DualRangeSlider({ min, max, step, value, onValueChange, onValueCommit }: DualRangeSliderProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef<"min" | "max" | null>(null);

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging.current || !sliderRef.current) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
            const percentage = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);

            let rawValue = percentage * (max - min) + min;
            // Round to step
            let newValue = Math.round(rawValue / step) * step;

            if (isDragging.current === "min") {
                const nextMin = Math.min(newValue, value[1] - step);
                if (nextMin !== value[0]) onValueChange([nextMin, value[1]]);
            } else {
                const nextMax = Math.max(newValue, value[0] + step);
                if (nextMax !== value[1]) onValueChange([value[0], nextMax]);
            }
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                onValueCommit(value);
                isDragging.current = null;
            }
        };

        if (isDragging.current) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("touchmove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchend", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [min, max, step, value, onValueChange, onValueCommit, isDragging.current]); // Dependency on isDragging triggers re-bind

    // Separate effect for mouse up listener isn't ideal due to stale closure if not careful, 
    // but let's try a simpler imperative approach for dragging

    const handleStart = (type: "min" | "max") => (e: React.MouseEvent | React.TouchEvent) => {
        isDragging.current = type;
        // We need to force a re-render or effect re-run if we rely on effect for global listeners
        // But better: attach listeners here? No, React state update usually re-renders.
        // Actually, `isDragging` usage in Effect dependency is tricky if it's a ref.
        // Let's use simple logic: attach global listeners ONLY when dragging starts?

        // Standard way:
        const onMove = (moveEvent: MouseEvent | TouchEvent) => {
            const rect = sliderRef.current!.getBoundingClientRect();
            const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
            const p = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
            let val = Math.round((p * (max - min) + min) / step) * step;

            if (type === "min") {
                const newMin = Math.min(val, value[1] - step);
                // We use the functional update form if we were inside the component but we have `value` from props.
                // Since this is event listener, `value` captured is stale? YES.
                // We need a ref for `value` or use functional SetPrice in parent... 
                // Parent passes `value` prop.
                // To fix stale closure, we can't use `value` from scope easily without ref.
                // Let's rely on the parent `onValueChange` being updating the prop, and this component re-rendering.
                // BUT event listeners close over the initial scope.
                // FIX: Use ref for current Value.
            }
        };
        // ... code omitted for brevity in thought ...
    };

    // Re-implementation with Ref for current value to avoid stale closures in event listeners
    const valueRef = useRef(value);
    valueRef.current = value;

    useEffect(() => {
        const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging.current || !sliderRef.current) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const p = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
            const raw = p * (max - min) + min;
            const stepped = Math.round(raw / step) * step;

            const currentMin = valueRef.current[0];
            const currentMax = valueRef.current[1];

            if (isDragging.current === "min") {
                const nextMin = Math.min(stepped, currentMax - step);
                // Clamp to min
                const clamped = Math.max(nextMin, min);
                if (clamped !== currentMin) onValueChange([clamped, currentMax]);
            } else {
                const nextMax = Math.max(stepped, currentMin + step);
                const clamped = Math.min(nextMax, max);
                if (clamped !== currentMax) onValueChange([currentMin, clamped]);
            }
        };

        const handleGlobalUp = () => {
            if (isDragging.current) {
                onValueCommit(valueRef.current);
                isDragging.current = null;
            }
        };

        window.addEventListener("mousemove", handleGlobalMove);
        window.addEventListener("touchmove", handleGlobalMove);
        window.addEventListener("mouseup", handleGlobalUp);
        window.addEventListener("touchend", handleGlobalUp);

        return () => {
            window.removeEventListener("mousemove", handleGlobalMove);
            window.removeEventListener("touchmove", handleGlobalMove);
            window.removeEventListener("mouseup", handleGlobalUp);
            window.removeEventListener("touchend", handleGlobalUp);
        }
    }, [min, max, step, onValueChange, onValueCommit]);
    // Removed `value` from dependency array to prevent effect re-binding on every drag (performance), used Ref instead.

    return (
        <div className="relative w-full h-8 flex items-center select-none touch-none" ref={sliderRef}>
            {/* Track Background */}
            <div className="absolute w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                {/* Active Range */}
                <div
                    className="absolute h-full bg-sky-500"
                    style={{
                        left: `${getPercentage(value[0])}%`,
                        right: `${100 - getPercentage(value[1])}%`
                    }}
                />
            </div>

            {/* Thumb Min */}
            <div
                className="absolute w-5 h-5 bg-white border-2 border-sky-500 rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
                style={{ left: `calc(${getPercentage(value[0])}% - 10px)` }}
                onMouseDown={(e) => { isDragging.current = "min"; e.preventDefault(); }}
                onTouchStart={(e) => { isDragging.current = "min"; }}
            />

            {/* Thumb Max */}
            <div
                className="absolute w-5 h-5 bg-white border-2 border-sky-500 rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
                style={{ left: `calc(${getPercentage(value[1])}% - 10px)` }}
                onMouseDown={(e) => { isDragging.current = "max"; e.preventDefault(); }}
                onTouchStart={(e) => { isDragging.current = "max"; }}
            />
        </div>
    );
}

export function ProductFilterSidebar({
    isOpen,
    toggleOpen,
    categories,
    filters,
    setFilters,
}: ProductFilterSidebarProps) {
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters({ ...filters, [key]: value });
    };

    return (
        <>
            {/* Toggle Button (Mobile/Desktop) */}
            {/* Toggle Button (Closed State) */}
            {!isOpen && (
                <Button
                    variant="outline"
                    size="icon"
                    className="fixed left-4 top-24 z-40 bg-white shadow-md md:relative md:top-0 md:left-0 md:bg-transparent md:shadow-none md:border-0"
                    onClick={toggleOpen}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out overflow-y-auto md:static md:translate-x-0 md:h-auto md:border-0 md:bg-transparent",
                    isOpen ? "translate-x-0" : "-translate-x-full md:hidden"
                )}
            >
                <div className="space-y-6 pt-24 px-0 pr-2 md:pt-0 pb-8">
                    {/* Header: Toggle + Search */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 bg-white border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700"
                            onClick={toggleOpen}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-sky-500 rounded-lg shadow-sm h-9"
                            />
                        </div>
                    </div>

                    <Accordion type="multiple" defaultValue={[]} className="w-full">
                        {/* Brand (Category) Section */}
                        <AccordionItem value="brand" className="border-b-slate-200 dark:border-b-slate-800">
                            <AccordionTrigger className="text-xl font-hand font-bold text-slate-800 dark:text-white hover:no-underline hover:text-sky-500">
                                Brand
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                                filters.category === "all"
                                                    ? "bg-sky-500 border-sky-500 text-white"
                                                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-500"
                                            )}
                                            onClick={() => handleFilterChange("category", "all")}
                                        >
                                            {filters.category === "all" && <Check className="h-3 w-3" />}
                                        </div>
                                        <span
                                            className="text-sm cursor-pointer hover:text-sky-500"
                                            onClick={() => handleFilterChange("category", "all")}
                                        >
                                            All Brands
                                        </span>
                                    </div>
                                    {categories.map((cat) => (
                                        <div key={cat.id} className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                                    filters.category === cat.slug
                                                        ? "bg-sky-500 border-sky-500 text-white"
                                                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-500"
                                                )}
                                                onClick={() => handleFilterChange("category", cat.slug)}
                                            >
                                                {filters.category === cat.slug && <Check className="h-3 w-3" />}
                                            </div>
                                            <label
                                                className="text-sm cursor-pointer hover:text-sky-500"
                                                onClick={() => handleFilterChange("category", cat.slug)}
                                            >
                                                {cat.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Color Section */}
                        <AccordionItem value="color" className="border-b-slate-200 dark:border-b-slate-800">
                            <AccordionTrigger className="text-xl font-hand font-bold text-slate-800 dark:text-white hover:no-underline hover:text-sky-500">
                                Color
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full cursor-pointer flex items-center justify-center border-2",
                                            filters.color === "all" ? "border-sky-500" : "border-slate-200 dark:border-slate-700"
                                        )}
                                        onClick={() => handleFilterChange("color", "all")}
                                        title="All Colors"
                                    >
                                        <span className="text-[10px] uppercase font-bold text-slate-500">All</span>
                                    </div>
                                    {COLORS.map((color) => (
                                        <div
                                            key={color.id}
                                            className={cn(
                                                "w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ring-2 ring-offset-2 ring-transparent",
                                                color.value,
                                                filters.color === color.id ? "ring-sky-500 ring-offset-white dark:ring-offset-slate-900" : ""
                                            )}
                                            onClick={() => handleFilterChange("color", color.id)}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Duration Section */}
                        <AccordionItem value="duration" className="border-b-slate-200 dark:border-b-slate-800">
                            <AccordionTrigger className="text-xl font-hand font-bold text-slate-800 dark:text-white hover:no-underline hover:text-sky-500">
                                Duration
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-1 pt-2">
                                    <div
                                        className={cn(
                                            "px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors",
                                            filters.duration === "all"
                                                ? "bg-slate-100 dark:bg-slate-800 text-sky-500"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                        onClick={() => handleFilterChange("duration", "all")}
                                    >
                                        All Durations
                                    </div>
                                    {DURATIONS.map((duration) => (
                                        <div
                                            key={duration}
                                            className={cn(
                                                "px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors",
                                                filters.duration === duration
                                                    ? "bg-slate-100 dark:bg-slate-800 text-sky-500"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                            onClick={() => handleFilterChange("duration", duration)}
                                        >
                                            {duration}
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Price Range Section */}
                        <AccordionItem value="price" className="border-none">
                            <AccordionTrigger className="text-xl font-hand font-bold text-slate-800 dark:text-white hover:no-underline hover:text-sky-500">
                                Price Range
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-6 px-4">
                                    <DualRangeSlider
                                        min={0}
                                        max={10000}
                                        step={100}
                                        value={priceRange}
                                        onValueChange={setPriceRange}
                                        onValueCommit={(value) => {
                                            handleFilterChange("priceRange", `${value[0]}-${value[1]}`);
                                        }}
                                    />
                                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mt-4">
                                        <span>₹{priceRange[0]}</span>
                                        <span>₹{priceRange[1]}</span>
                                    </div>
                                    <p className="text-center text-sm font-semibold text-sky-500 mt-2">
                                        ₹{priceRange[0]} - ₹{priceRange[1]} / day
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </aside >
        </>
    );
}
