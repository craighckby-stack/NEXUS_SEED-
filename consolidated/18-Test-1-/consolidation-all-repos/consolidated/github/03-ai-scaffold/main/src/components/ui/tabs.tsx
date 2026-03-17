// src/components/ui/tabs.ts
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Tabs as TabsPrimitive, Trigger as TriggerPrimitive, Content as ContentPrimitive } from '@radix-ui/react-tabs';

const Tabs = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<TabsPrimitive>>((props, ref) => (
  <TabsPrimitive.Root ref={ref} {...props} />
));

const TabsList = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<TabsPrimitive.List>>((props, ref) => (
  <TabsPrimitive.List ref={ref} {...props} />
));

const TabsTrigger = forwardRef<
  React.ElementRef<typeof TriggerPrimitive>,
  React.ComponentPropsWithoutRef<typeof TriggerPrimitive>
>(({ className, children, ...props }, ref) => (
  <TriggerPrimitive
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  >
    {children}
  </TriggerPrimitive>
));

TabsTrigger.displayName = TriggerPrimitive.displayName;

const TabsContent = forwardRef<
  React.ElementRef<typeof ContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContentPrimitive>
>(({ className, children, ...props }, ref) => (
  <ContentPrimitive
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  >
    {children}
  </ContentPrimitive>
));

TabsContent.displayName = ContentPrimitive.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

**