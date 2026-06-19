import React from 'react';

export interface NavItem {
  label: string;
  href: string;
}

export interface Product {
  id: number;
  title: string;
  price: string;
  icon: React.ReactNode;
}

export interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface ContactInfo {
  type: 'location' | 'hours' | 'whatsapp' | 'instagram';
  label: string;
  value: string;
  href?: string;
  icon: React.ReactNode;
}