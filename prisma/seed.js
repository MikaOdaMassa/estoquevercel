const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = '123'; // Senha padrão inicial
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username: 'chefe' },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      username: 'chefe',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('Usuário ADMIN criado com sucesso!');
  console.log('Username: chefe');
  console.log('Password: 123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
