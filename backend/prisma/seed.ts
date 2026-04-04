import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. CATEGORIES ─────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Steel & Metal' },
      update: {}, create: { name: 'Steel & Metal',
        unit_options: ['Ton', 'KG', 'Piece'], children: { create: [
          { name: 'Rebar', unit_options: ['Ton', 'KG'] },
          { name: 'Steel Sections', unit_options: ['Ton', 'Piece'] },
          { name: 'Wire Mesh', unit_options: ['Roll', 'SQM'] },
        ]}}
    }),
    prisma.category.upsert({ where: { name: 'Concrete & Cement' },
      update: {}, create: { name: 'Concrete & Cement',
        unit_options: ['M3', 'Bag', 'Ton'], children: { create: [
          { name: 'Portland Cement', unit_options: ['Bag', 'Ton'] },
          { name: 'Ready Mix Concrete', unit_options: ['M3'] },
          { name: 'Blocks & Bricks', unit_options: ['Piece', 'Pallet'] },
        ]}}
    }),
    prisma.category.upsert({ where: { name: 'Electrical' },
      update: {}, create: { name: 'Electrical',
        unit_options: ['Roll', 'Piece', 'Box', 'M'], children: { create: [
          { name: 'Cables & Wires', unit_options: ['Roll', 'M'] },
          { name: 'Conduits', unit_options: ['Piece', 'M'] },
          { name: 'Distribution Boards', unit_options: ['Piece'] },
        ]}}
    }),
    prisma.category.upsert({ where: { name: 'Finishing Materials' },
      update: {}, create: { name: 'Finishing Materials',
        unit_options: ['SQM', 'Box', 'Piece', 'L'], children: { create: [
          { name: 'Ceramic Tiles', unit_options: ['SQM', 'Box'] },
          { name: 'Paints', unit_options: ['L', 'Gallon'] },
          { name: 'Plaster', unit_options: ['Bag', 'Ton'] },
        ]}}
    }),
  ]);
  console.log(`✅ Created ${categories.length} root categories`);

  // ── 2. COMPANIES ──────────────────────────────────────────────────────────
  let contractorCompany = await prisma.company.findFirst({ where: { name: 'Al-Farabi Construction Co.' } });
  if (!contractorCompany) {
    contractorCompany = await prisma.company.create({
      data: {
        name: 'Al-Farabi Construction Co.',
        type: 'CONTRACTOR',
        address: 'King Fahd Road, Riyadh',
        country: 'SA',
        tax_id: '310123456700003',
        commercial_reg_no: 'CR-1010123456',
        is_verified: true,
      },
    });
  }

  let supplierCompany1 = await prisma.company.findFirst({ where: { name: 'Al-Rashidi Steel Trading' } });
  if (!supplierCompany1) {
    supplierCompany1 = await prisma.company.create({
      data: {
        name: 'Al-Rashidi Steel Trading',
        type: 'SUPPLIER',
        address: 'Industrial City, Jeddah',
        country: 'SA',
        tax_id: '310987654300003',
        commercial_reg_no: 'CR-4030987654',
        is_verified: true,
      },
    });
  }

  let supplierCompany2 = await prisma.company.findFirst({ where: { name: 'Gulf Cement & Building Materials' } });
  if (!supplierCompany2) {
    supplierCompany2 = await prisma.company.create({
      data: {
        name: 'Gulf Cement & Building Materials',
        type: 'SUPPLIER',
        address: 'Second Industrial Zone, Riyadh',
        country: 'SA',
        tax_id: '310555123400003',
        commercial_reg_no: 'CR-1010555123',
        is_verified: true,
      },
    });
  }

  let egyptContractor = await prisma.company.findFirst({ where: { name: 'Nile Development & Construction' } });
  if (!egyptContractor) {
    egyptContractor = await prisma.company.create({
      data: {
        name: 'Nile Development & Construction',
        type: 'CONTRACTOR',
        address: 'New Administrative Capital, Cairo',
        country: 'EG',
        tax_id: '123-456-789',
        commercial_reg_no: 'CR-EG-2024-001',
        is_verified: true,
      },
    });
  }
  console.log('✅ Created companies');

  // ── 3. USERS ───────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('Demo1234!', 10);

  const contractorAdmin = await prisma.user.upsert({
    where: { email: 'ahmed@alfarabi.sa' },
    update: { password_hash: hash },
    create: {
      email: 'ahmed@alfarabi.sa',
      password_hash: hash,
      phone: '+966501234568',
      role: 'PROCUREMENT_MANAGER',
      company_id: contractorCompany.id,
      status: 'ACTIVE',
    },
  });

  const siteEngineer = await prisma.user.upsert({
    where: { email: 'khalid@alfarabi.sa' },
    update: { password_hash: hash },
    create: {
      email: 'khalid@alfarabi.sa',
      password_hash: hash,
      phone: '+966501234569',
      role: 'SITE_ENGINEER',
      company_id: contractorCompany.id,
      status: 'ACTIVE',
    },
  });

  const supplierUser1 = await prisma.user.upsert({
    where: { email: 'omar@alrashidi.sa' },
    update: { password_hash: hash },
    create: {
      email: 'omar@alrashidi.sa',
      password_hash: hash,
      phone: '+966509876544',
      role: 'PROCUREMENT_MANAGER',
      company_id: supplierCompany1.id,
      status: 'ACTIVE',
    },
  });

  const supplierUser2 = await prisma.user.upsert({
    where: { email: 'ali@gulfcement.sa' },
    update: { password_hash: hash },
    create: {
      email: 'ali@gulfcement.sa',
      password_hash: hash,
      phone: '+966505551235',
      role: 'PROCUREMENT_MANAGER',
      company_id: supplierCompany2.id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'mostafa@niledev.eg' },
    update: { password_hash: hash },
    create: {
      email: 'mostafa@niledev.eg',
      password_hash: hash,
      phone: '+201012345678',
      role: 'PROCUREMENT_MANAGER',
      company_id: egyptContractor.id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@cc.io' },
    update: { password_hash: hash },
    create: {
      email: 'admin@cc.io',
      password_hash: hash,
      phone: '+966500000001',
      role: 'ADMIN',
      company_id: contractorCompany.id,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created users');

  // ── 4. WALLETS ─────────────────────────────────────────────────────────────
  let w1 = await prisma.wallet.findFirst({ where: { company_id: contractorCompany.id } });
  if (!w1) w1 = await prisma.wallet.create({
    data: { company_id: contractorCompany.id, balance: 0, currency: 'SAR' },
  });
  let w2 = await prisma.wallet.findFirst({ where: { company_id: supplierCompany1.id } });
  if (!w2) w2 = await prisma.wallet.create({
    data: { company_id: supplierCompany1.id, balance: 0, currency: 'SAR' },
  });
  let w3 = await prisma.wallet.findFirst({ where: { company_id: supplierCompany2.id } });
  if (!w3) w3 = await prisma.wallet.create({
    data: { company_id: supplierCompany2.id, balance: 0, currency: 'SAR' },
  });
  let w4 = await prisma.wallet.findFirst({ where: { company_id: egyptContractor.id } });
  if (!w4) w4 = await prisma.wallet.create({
    data: { company_id: egyptContractor.id, balance: 0, currency: 'EGP' },
  });
  console.log('✅ Created wallets');

  // ── 5. PRODUCTS ────────────────────────────────────────────────────────────
  const products = [
    { name: 'Steel Rebar 12mm', category: 'Steel & Metal', sub_category: 'Rebar',
      unit: 'Ton', base_price: 3800, supplier_company_id: supplierCompany1.id,
      description: 'High-tensile deformed steel rebar, Grade 60, SASO certified',
      image_url: null },
    { name: 'Steel Rebar 16mm', category: 'Steel & Metal', sub_category: 'Rebar',
      unit: 'Ton', base_price: 4200, supplier_company_id: supplierCompany1.id,
      description: 'High-tensile deformed steel rebar, Grade 60, SASO certified',
      image_url: null },
    { name: 'Steel Rebar 20mm', category: 'Steel & Metal', sub_category: 'Rebar',
      unit: 'Ton', base_price: 4350, supplier_company_id: supplierCompany1.id,
      description: 'Heavy duty deformed steel rebar, Grade 60',
      image_url: null },
    { name: 'Wire Mesh 200×200mm', category: 'Steel & Metal', sub_category: 'Wire Mesh',
      unit: 'SQM', base_price: 45, supplier_company_id: supplierCompany1.id,
      description: 'Welded wire mesh for slab reinforcement, 6mm wire',
      image_url: null },
    { name: 'Portland Cement Type I', category: 'Concrete & Cement',
      sub_category: 'Portland Cement', unit: 'Bag', base_price: 28,
      supplier_company_id: supplierCompany2.id,
      description: '50kg bags, Saudi Cement, SASO 1051 compliant',
      image_url: null },
    { name: 'Portland Cement Type V', category: 'Concrete & Cement',
      sub_category: 'Portland Cement', unit: 'Bag', base_price: 32,
      supplier_company_id: supplierCompany2.id,
      description: '50kg bags, sulfate resistant, for foundations',
      image_url: null },
    { name: 'Ready Mix Concrete C25', category: 'Concrete & Cement',
      sub_category: 'Ready Mix Concrete', unit: 'M3', base_price: 280,
      supplier_company_id: supplierCompany2.id,
      description: 'C25 grade, delivered to site, min order 6 M3',
      image_url: null },
    { name: 'Concrete Blocks 20cm', category: 'Concrete & Cement',
      sub_category: 'Blocks & Bricks', unit: 'Piece', base_price: 4.5,
      supplier_company_id: supplierCompany2.id,
      description: 'Hollow concrete blocks 40×20×20cm, Grade A',
      image_url: null },
    { name: 'Ceramic Floor Tiles 60×60', category: 'Finishing Materials',
      sub_category: 'Ceramic Tiles', unit: 'SQM', base_price: 85,
      supplier_company_id: supplierCompany2.id,
      description: 'Polished ceramic floor tiles, white, R9 slip resistance',
      image_url: null },
    { name: 'Gypsum Board 12mm', category: 'Finishing Materials',
      sub_category: 'Plaster', unit: 'Piece', base_price: 22,
      supplier_company_id: supplierCompany2.id,
      description: 'Standard gypsum board 1.2×2.4m, fire rated available',
      image_url: null },
  ];

  for (const p of products) {
    const exists = await prisma.product.findFirst({
      where: { name: p.name, supplier_company_id: p.supplier_company_id }
    });
    if (!exists) {
      await prisma.product.create({ data: { ...p, is_active: true } });
    }
  }
  console.log(`✅ Created ${products.length} products`);

  // ── 6. PROJECTS & SITES ────────────────────────────────────────────────────
  let project1 = await prisma.project.findFirst({
    where: { name: 'Riyadh Villa Compound Phase 1', company_id: contractorCompany.id },
  });
  if (!project1) project1 = await prisma.project.create({
    data: {
      name: 'Riyadh Villa Compound Phase 1',
      company_id: contractorCompany.id,
      budget: 15000000,
      start_date: new Date('2025-09-01'),
      end_date: new Date('2026-08-31'),
      sites: { create: [{
        name: 'Main Site — North Block',
        latitude: 24.7577,
        longitude: 46.6934,
        contact_person: 'Khalid Al-Mutairi',
        contact_phone: '+966501234569',
      }]},
    },
  });

  let project2 = await prisma.project.findFirst({ where: { name: 'New Cairo Office Tower', company_id: egyptContractor.id } });
  if (!project2) project2 = await prisma.project.create({
    data: {
      name: 'New Cairo Office Tower',
      company_id: egyptContractor.id,
      budget: 85000000,
      start_date: new Date('2025-11-01'),
      end_date: new Date('2027-06-30'),
      sites: { create: [{
        name: 'Tower Site',
        latitude: 30.0330,
        longitude: 31.7394,
        contact_person: 'Mohamed Hassan',
        contact_phone: '+201012345679',
      }]},
    },
  });
  console.log('✅ Created projects and sites');

  // ── 7. BOQ ITEMS ──────────────────────────────────────────────────────────
  await prisma.bOQItem.createMany({
    skipDuplicates: true,
    data: [
      { project_id: project1.id,
        description: 'Rebar 16mm', quantity: 500, unit: 'Ton',
        estimated_rate: 4500, code: '03-2100' },
      { project_id: project1.id,
        description: 'Wire Mesh 200×200', quantity: 8000, unit: 'SQM',
        estimated_rate: 48, code: '03-2200' },
      { project_id: project1.id,
        description: 'Portland Cement Type I', quantity: 12000, unit: 'Bag',
        estimated_rate: 30, code: '03-3000' },
      { project_id: project1.id,
        description: 'Ready Mix C25', quantity: 2400, unit: 'M3',
        estimated_rate: 300, code: '03-3010' },
    ],
  });
  console.log('✅ Created BOQ items');

  // ── 8. OPEN RFQ (so supplier can see a feed) ──────────────────────────────
  const openRFQ = await prisma.rFQ.create({
    data: {
      created_by: contractorAdmin.id,
      project_id: project1.id,
      status: 'OPEN',
      payment_terms: 'CREDIT',
      delivery_date_required: new Date(Date.now() + 7 * 86400000),
      items: { create: [{
        product_name: 'Steel Rebar 16mm',
        quantity: 100,
        unit: 'Ton',
      }]},
    },
  });

  // ── 9. A BID on that RFQ (so contractor can see comparison) ──────────────
  await prisma.bid.create({
    data: {
      rfq_id: openRFQ.id,
      supplier_id: supplierCompany1.id,
      status: 'PENDING',
      rejection_reason: null,
      total_price: 420000,
      valid_until: new Date(Date.now() + 2 * 86400000),
      items: { create: [{
        rfq_item_id: (await prisma.rFQItem.findFirst({
          where: { rfq_id: openRFQ.id } }))!.id,
        unit_price: 4200,
      }]},
    },
  });
  console.log('✅ Created RFQ and bid');

  // ── 10. AN AWARDED RFQ + PO (so orders list has data) ────────────────────
  const awardedRFQ = await prisma.rFQ.create({
    data: {
      created_by: contractorAdmin.id,
      project_id: project1.id,
      status: 'AWARDED',
      payment_terms: 'CASH',
      delivery_date_required: new Date(Date.now() + 2 * 86400000),
      items: { create: [{
        product_name: 'Portland Cement Type I',
        quantity: 2000,
        unit: 'Bag',
      }]},
    },
  });

  const cementBid = await prisma.bid.create({
    data: {
      rfq_id: awardedRFQ.id,
      supplier_id: supplierCompany2.id,
      status: 'ACCEPTED',
      total_price: 56000,
      valid_until: new Date(Date.now() + 3 * 86400000),
      items: { create: [{
        rfq_item_id: (await prisma.rFQItem.findFirst({
          where: { rfq_id: awardedRFQ.id } }))!.id,
        unit_price: 28,
      }]},
    },
  });

  const po = await prisma.purchaseOrder.create({
    data: {
      supplier_id: supplierCompany2.id,
      rfq_id: awardedRFQ.id,
      project_id: project1.id,
      status: 'OUT_FOR_DELIVERY',
      payment_terms: 'CASH',
      delivery_date_required: new Date(Date.now() + 2 * 86400000),
      total_amount: 56500,
      items: { create: [{
        item_description: 'Portland Cement Type I',
        ordered_qty: 2000,
        unit_price: 28,
      }]},
    },
  });
  console.log('✅ Created PO in OUT_FOR_DELIVERY status');

  // ── 11. DAILY LOG SAMPLE ──────────────────────────────────────────────────
  await prisma.dailyLog.create({
    data: {
      project_id: project1.id,
      user_id: siteEngineer.id,
      log_date: new Date(Date.now() - 86400000), // yesterday
      status: 'SUBMITTED',
      weather_data: {
        temp: 32, feels_like: 36, humidity: 42,
        wind_speed: 12, condition: 'Clear', icon: '01d',
        fetched_at: new Date().toISOString(),
      },
      attendance_data: [
        { id: '1', company_name: 'Own Crew', trade: 'Mason',
          headcount: 8, hours_worked: 9 },
        { id: '2', company_name: 'Al-Nour Electrical', trade: 'Electrician',
          headcount: 4, hours_worked: 8 },
      ],
      progress_notes: [
        { zone: 'Floor 2 - East Wing', work_done: 'Completed column shuttering',
          percentage: 100, issues: '' },
        { zone: 'Ground Floor', work_done: 'Rebar placement ongoing',
          percentage: 60, issues: 'Waiting on rebar delivery' },
      ],
    },
  });
  console.log('✅ Created daily log sample');

  // ── 12. NOTIFICATIONS ─────────────────────────────────────────────────────
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      { user_id: contractorAdmin.id, title: 'New bid received',
        body: 'Al-Rashidi Steel submitted a bid on RFQ #RFQ-0001',
        type: 'rfq_bid', entity_id: openRFQ.id, is_read: false },
      { user_id: contractorAdmin.id, title: 'Order out for delivery',
        body: 'PO #PO-0001 is out for delivery — expected Jan 14',
        type: 'order_status', entity_id: po.id, is_read: false },
    ],
  });
  console.log('✅ Created notifications');

  console.log('\n🎉 Seed complete!\n');
  console.log('Test accounts (all password: Demo1234!):');
  console.log('  Contractor Admin (KSA): ahmed@alfarabi.sa');
  console.log('  Site Engineer   (KSA): khalid@alfarabi.sa');
  console.log('  Supplier 1      (KSA): omar@alrashidi.sa');
  console.log('  Supplier 2      (KSA): ali@gulfcement.sa');
  console.log('  Contractor Admin (EG): mostafa@niledev.eg');
  console.log('  Platform Admin       : admin@cc.io');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
