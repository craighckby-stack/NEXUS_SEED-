/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Modernize import statement
import type { NextPage, GetServerSideProps } from 'next/types';

/**
 * Next.js environment types.
 */
declare module 'next' {
  // Update types to match Next.js version 13
  export interface NextPageContext {
    params: { [key: string]: string };
    query: { [key: string]: string };
    req: Request;
    res: Response;
  }

  // Update GetServerSideProps type
  export interface GetServerSideProps {
    /**
     * Server-side props for Next.js components.
     */
    props: Record<string, any>;

    /**
     * Optional server-side props for Next.js components.
     */
    revalidate?: (date: Date) => Promise<Date>;
  }
}