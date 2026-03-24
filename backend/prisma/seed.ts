import 'dotenv/config';
import { PrismaClient, CompanyType, Role, RFQStatus, BidStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please create a .env file in the backend directory with:');
  console.error('DATABASE_URL="postgresql://user:password@localhost:5432/dbname"');
  process.exit(1);
}

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 0. Cleanup Database (Reverse dependency order)
  console.log('Cleaning up existing data...');
  await prisma.transaction.deleteMany();
  await prisma.syncChange.deleteMany();
  await prisma.logPhoto.deleteMany();
  await prisma.dailyLog.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.gRNItem.deleteMany();
  await prisma.deliveryNote.deleteMany();
  await prisma.pOItem.deleteMany();
  await prisma.invoice.deleteMany(); // Invoices might depend on POs
  await prisma.purchaseOrder.deleteMany();
  await prisma.bidItem.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.rFQItem.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.bOQItem.deleteMany();
  await prisma.site.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.company.deleteMany();
  console.log('Cleanup complete.');

  // 1. Create Companies
  const contractor = await prisma.company.create({
    data: {
      name: 'Alpha Construction Co.',
      type: CompanyType.CONTRACTOR,
      country: 'SA',
      commercial_reg_no: 'CR-1001',
      tax_id: 'TAX-1001',
      is_verified: true,
      wallet_balance: 100000.00,
    },
  });

  const supplier = await prisma.company.create({
    data: {
      name: 'Mega Materials Supply',
      type: CompanyType.SUPPLIER,
      country: 'SA',
      commercial_reg_no: 'CR-2002',
      tax_id: 'TAX-2002',
      is_verified: true,
      wallet_balance: 5000.00,
    },
  });

  // 2. Create Wallets
  await prisma.wallet.create({
    data: {
      company_id: contractor.id,
      balance: 100000.00,
      currency: 'SAR',
    },
  });

  await prisma.wallet.create({
    data: {
      company_id: supplier.id,
      balance: 5000.00,
      currency: 'SAR',
    },
  });

  // 3. Create Users
  const defaultPassword = 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const adminUser = await prisma.user.create({
    data: {
      company_id: contractor.id,
      email: 'admin@alpha.com',
      password_hash: passwordHash,
      role: Role.ADMIN,
      phone: '+966500000001',
    },
  });

  const siteEngineer = await prisma.user.create({
    data: {
      company_id: contractor.id,
      email: 'engineer@alpha.com',
      password_hash: passwordHash,
      role: Role.SITE_ENGINEER,
      phone: '+966500000002',
    },
  });

  const supplierUser = await prisma.user.create({
    data: {
      company_id: supplier.id,
      email: 'sales@mega.com',
      password_hash: passwordHash,
      role: Role.ADMIN, // Admin of the supplier company
      phone: '+966500000003',
    },
  });

  // 4. Create Project
  const project = await prisma.project.create({
    data: {
      company_id: contractor.id,
      name: 'Riyadh Tower A',
      budget: 5000000.00,
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  // 5. Create Site
  const site = await prisma.site.create({
    data: {
      project_id: project.id,
      name: 'North Wing',
      // location: 'Riyadh', 
      latitude: 24.7136,
      longitude: 46.6753,
      contact_person: 'Eng. Ahmed',
    },
  });

  // 6. Create BOQ Items
  const boq1 = await prisma.bOQItem.create({
    data: {
      project_id: project.id,
      code: 'CON-001',
      description: 'Concrete Grade 40',
      quantity: 1000,
      unit: 'm3',
      estimated_rate: 350.00,
    },
  });

  // 7. Create RFQ
  const rfq = await prisma.rFQ.create({
    data: {
      project_id: project.id,
      created_by: adminUser.id,
      status: RFQStatus.OPEN,
      deadline: new Date(new Date().setDate(new Date().getDate() + 7)),
      items: {
        create: [
          {
             boq_item_id: boq1.id,
             product_name: 'Concrete Grade 40',
             quantity: 500,
             unit: 'm3',
          }
        ]
      }
    },
  });

  // 8. Create Bid
  // Fetch RFQ Items first to properly link bid items
  const rfqItems = await prisma.rFQItem.findMany({ where: { rfq_id: rfq.id } });
  
  if (rfqItems.length > 0) {
    const bid = await prisma.bid.create({
      data: {
        rfq_id: rfq.id,
        supplier_id: supplier.id,
        status: BidStatus.PENDING,
        total_price: 175000.00, // 500 * 350
        items: {
          create: [
            {
              rfq_item_id: rfqItems[0].id,
              unit_price: 350.00,
            }
          ]
        }
      }
    });
    console.log(`Created bid ${bid.id} with ${rfqItems.length} item(s)`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
