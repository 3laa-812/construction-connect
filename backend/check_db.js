
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  const companies = await prisma.company.count();
  const invoices = await prisma.invoice.count();
  const orders = await prisma.purchaseOrder.count();
  console.log('Companies:', companies);
  console.log('Invoices:', invoices);
  console.log('Orders:', orders);
}

checkData()
  .catch(e => console.error(e))
  .finally(async () => await prisma.());

