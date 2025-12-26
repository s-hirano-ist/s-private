import { PrismaClient } from '@s-hirano-ist/s-database/generated';
import { createPushoverService } from '@s-hirano-ist/s-notification';

const DATABASE_URL = process.env.DATABASE_URL;
const PUSHOVER_URL = process.env.PUSHOVER_URL;
const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY;
const PUSHOVER_APP_TOKEN = process.env.PUSHOVER_APP_TOKEN;

if (!DATABASE_URL || !PUSHOVER_URL || !PUSHOVER_USER_KEY || !PUSHOVER_APP_TOKEN)
  throw new Error('ENV not set.');

const prisma = new PrismaClient({ accelerateUrl: DATABASE_URL });
const notificationService = createPushoverService({
  url: PUSHOVER_URL,
  userKey: PUSHOVER_USER_KEY,
  appToken: PUSHOVER_APP_TOKEN,
});

const USERNAME_TO_EXPORT = process.env.USERNAME_TO_EXPORT;

if (!USERNAME_TO_EXPORT) throw new Error('ENV not set.');

try {
  await prisma.article.updateMany({
    where: { userId: USERNAME_TO_EXPORT, status: 'LAST_UPDATED' },
    data: { status: 'UNEXPORTED' },
  });
  console.log('💾 LAST_UPDATEDの記事をUNEXPORTEDに変更しました');
  await notificationService.notifyInfo('revert-articles completed', {
    caller: 'revert-articles',
  });
} catch (error) {
  console.error('❌ エラーが発生しました:', error);
  await notificationService.notifyError(`revert-articles failed: ${error}`, {
    caller: 'revert-articles',
  });
  process.exit(1);
}
