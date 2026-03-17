"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Table container component
function TableContainer({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Table component
function Table({ className, children, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    >
      {children}
    </table>
  )
}

// Table header component
function TableHeader({ className, children, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    >
      {children}
    </thead>
  )
}

// Table body component
function TableBody({ className, children, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    >
      {children}
    </tbody>
  )
}

// Table footer component
function TableFooter({ className, children, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  )
}

// Table row component
function TableRow({ className, children, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

// Table head component
function TableHead({ className, children, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

// Table cell component
function TableCell({ className, children, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

// Table caption component
function TableCaption({
  className,
  children,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    >
      {children}
    </caption>
  )
}

// Example usage
function ExampleTable() {
  return (
    <TableContainer>
      <Table>
        <TableCaption>Caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Head 1</TableHead>
            <TableHead>Head 2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell 1</TableCell>
            <TableCell>Cell 2</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Footer 1</TableCell>
            <TableCell>Footer 2</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  )
}

export {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}