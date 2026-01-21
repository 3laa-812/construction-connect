const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const uuidv4 = randomUUID;
  console.log('Checking database...');
  const companiesCount = await prisma.company.count();
  
  if (companiesCount > 2) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding data...');

  const timestamp = BigInt(Date.now());

  // 1. Create Companies
  const supplier = await prisma.company.create({
    data: {
      id: uuidv4(),
      name: 'Saudi Ceramics',
      type: 'supplier',
      wallet_balance: 0,
      created_at: timestamp,
      updated_at: timestamp,
    }
  });

  const buyer = await prisma.company.create({
    data: {
      id: uuidv4(),
      name: 'BuildPro Construction',
      type: 'buyer',
      wallet_balance: 1000000,
      created_at: timestamp,
      updated_at: timestamp,
    }
  });

  // 2. Create Project
  const project = await prisma.project.create({
    data: {
      id: uuidv4(),
      company_id: buyer.id,
      name: 'King Abdullah Financial District',
      budget: 5000000,
      start_date: timestamp,
      end_date: timestamp + BigInt(1000 * 60 * 60 * 24 * 365), // +1 year
      created_at: timestamp,
      updated_at: timestamp,
    }
  });

  // 3. Create Purchase Order
  const po = await prisma.purchaseOrder.create({
    data: {
      id: uuidv4(),
      project_id: project.id,
      supplier_id: supplier.id, // We just added this relation to schema? Or need to check if it exists in DB schema
      status: 'confirmed',
      total_amount: 150000,
      created_at: timestamp,
      updated_at: timestamp,
    }
  });

  // 4. Create Invoice
  const invoice = await prisma.invoice.create({
    data: {
      id: uuidv4(),
      supplier_id: supplier.id,
      buyer_id: buyer.id,
      status: 'sent',
      total_amount: 150000,
      created_at: timestamp,
      updated_at: timestamp,
    }
  });

  // 5. Create Sync Changes
  // We need to notify sync engine about these new records
  const changes = [
    { table: 'companies', id: supplier.id },
    { table: 'companies', id: buyer.id },
    { table: 'projects', id: project.id },
    { table: 'purchase_orders', id: po.id },
    { table: 'invoices', id: invoice.id },
  ];

  for (const change of changes) {
    await prisma.syncChange.create({
      data: {
        id: uuidv4(),
        table_name: change.table,
        record_id: change.id,
        operation: 'created',
        changed_at: timestamp,
      }
    });
  }

  console.log('Seeding completed successfully!');
  console.log('Created:');
  console.log('- 2 Companies');
  console.log('- 1 Project');
  console.log('- 1 Purchase Order');
  console.log('- 1 Invoice');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
