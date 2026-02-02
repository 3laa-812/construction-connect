import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // For MVP, we might fetch from a central catalog or CompanySettings
    // Since the schema supports CompanySettings.catalog (JSON), let's try that or fallback to BOQ items as a "catalog" of what's used.
    
    // Approach: Fetch unique BOQ Items across all projects to serve as a "History Catalog"
    // Ideally user wants "Vendor Discovery", but we need a source of materials first.
    // Let's return a simple list of "Material Integration" placeholders for now if no catalog exists.

    return [
      { id: '1', name: 'Portland Cement', category: 'Concrete', unit: 'Bag', price: 25.00, vendor: 'Alpha Concrete' },
      { id: '2', name: 'Steel Rebar 10mm', category: 'Steel', unit: 'Ton', price: 2200.00, vendor: 'MetalWorks SA' },
      { id: '3', name: 'Red Bricks', category: 'Masonry', unit: '1000 pcs', price: 1500.00, vendor: 'ClayMaster' },
      { id: '4', name: 'Electrical Wire 4mm', category: 'Electrical', unit: 'Roll', price: 120.00, vendor: 'VoltSupply' },
      { id: '5', name: 'PVC Pipe 2 inch', category: 'Plumbing', unit: 'Meter', price: 15.00, vendor: 'FlowTech' },
    ];
  }

  async findOne(id: string) {
    return this.findAll().then(items => items.find(item => item.id === id));
  }
}
