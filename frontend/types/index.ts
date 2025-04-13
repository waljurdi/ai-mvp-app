
// TypeScript types for the application
// This file contains type definitions for various entities used in the application
// including product information, user data, and navigation parameters.

// Define and export the ProductInfo type
export interface ProductInfo {
    _id?: string;
    barcode: string;
    image_url?: string;
    nutritional_facts?: Record<string, string | number>;
    error?: boolean;
    message?: string;
  }
