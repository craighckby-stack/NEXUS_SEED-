"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  className?: string
  defaultValue?: number | number[]
  value?: number | number[]
  min?: number
  max?: number
}

function Slider({ className, defaultValue, value, min = 0, max = 100, ...props }: SliderProps) {
  const initialValues = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  const sliderClassNames = cn(
    "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
    className
  )

  const trackClassNames = cn(
    "bg-muted relative grow overflow-hidden rounded-full"
  )

  const rangeClassNames = cn(
    "bg-primary absolute"
  )

  const thumbClassNames = cn(
    "border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={sliderClassNames}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={trackClassNames}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={rangeClassNames}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: initialValues.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={thumbClassNames}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }