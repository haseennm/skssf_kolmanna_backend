import { FastifyInstance } from 'fastify'
import { activeYearRouter } from './module/year/activeYear.router'
import { programRouter } from './module/programs/programs.router'
import { paymentCategoryRouter } from './module/payment_category/payment_category.router'
import { paymentLedgerRouter } from './module/paymentLedger/paymentLedger.router'
import { userRouter } from './module/user/user.router'
import { itemRouter } from './module/item/item.router'
import { stockRouter } from './module/stock/stock.router'
import { lostStockRouter } from './module/lostStock/lostStock.router'
import { sahachariUserRouter } from './module/sahachari/sahachariUsers/sahachariUser.router'
import { sahachariItemRouter } from './module/sahachari/sahachariItems/sahachariItem.router'
import { sahachariIssuesRouter } from './module/sahachari/sahachariUses/sahachari.router'


export default async function registerRoutes(app: FastifyInstance) {
  app.register(activeYearRouter, { prefix: '/active/year' })
  app.register(programRouter, { prefix: '/program' })
  app.register(paymentCategoryRouter, { prefix: '/payment/category' })
  app.register(paymentLedgerRouter, { prefix: '/payment/ledger' })
  app.register(userRouter, { prefix: '/user' })
  app.register(itemRouter, { prefix: '/item' })
  app.register(stockRouter, { prefix: '/stock' })
  app.register(lostStockRouter, { prefix: '/lost/stock' })
  app.register(sahachariUserRouter, { prefix: '/sahachari/user' })
  app.register(sahachariItemRouter, { prefix: '/sahachari/item' })
  app.register(sahachariIssuesRouter, { prefix: '/sahachari/issues' })
  
}