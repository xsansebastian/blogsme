---
layout: post
title: "Event-Driven S4HC + BDC Integration Architecture in CAP"
date: 2026-02-22 09:00:00 +0100
categories: sap cap tech architecture
---

# Event-Driven S4HC + BDC Integration Architecture in CAP

One of the problems I keep running into in enterprise integration projects is the question of **who owns the truth**. You have SAP S/4HANA Cloud generating business events in real time. You have SAP Business Data Cloud (BDC) operating on its own schedule, with its own data model, running batch jobs. And somewhere in the middle sits your CAP application, expected to make sense of all of it and expose a coherent domain model to consumers.

Three systems. Three data models. One CAP application that has to consolidate them without turning into a tightly coupled monster.

This post is my attempt to draw the architecture clearly—what patterns I use, how the data flows, and why each piece exists where it does.

---

## The Three Systems and Their Data Models

Before talking integration, it's worth being precise about what each system owns.

### System 1: SAP S/4HANA Cloud (S4HC)

S4HC is the transactional system of record. It emits **Business Events** via SAP Event Mesh whenever domain objects change state—a sales order is created, a business partner is updated, a delivery is confirmed. These events are the system's way of announcing facts that already happened.

S4HC's data model is deeply normalized and process-oriented. Think `SalesOrder`, `SalesOrderItem`, `BusinessPartner`, `PurchaseOrder`. The relationships are rich and the entities carry ERP semantics—company codes, controlling areas, document categories.

```
S4HC Domain Model (simplified)
--------------------------------
SalesOrder
  ├── SalesOrderItem[]
  │     └── PricingElement[]
  └── Partner[]

BusinessPartner
  ├── Address[]
  └── BankAccount[]
```

### System 2: SAP Business Data Cloud (BDC)

BDC is SAP's data management platform for analytics, reporting, and cross-system data harmonization. It operates on **batch cadences** driven by a job scheduler—think nightly loads, delta extractions, dimension refreshes. Its data model is analytical and denormalized: facts, dimensions, aggregates.

BDC holds consolidated views across multiple SAP systems, so its entities look different from S4HC's transactional objects. You'll find `RevenueItem`, `CustomerDimension`, `ProductDimension`—structures optimized for querying, not for transactional processing.

```
BDC Analytical Model (simplified)
------------------------------------
RevenueItem (fact)
  ├── CustomerDimension (dimension)
  ├── ProductDimension (dimension)
  └── TimeDimension (dimension)

InventorySnapshot (fact)
  └── PlantDimension (dimension)
```

### System 3: CAP Application (the consolidation layer)

The CAP application is neither a transactional system nor an analytics engine. It's a **domain layer**—it holds the business model that your application consumers care about, independent of the source systems' internal structures. Its job is to listen to S4HC events, pull from BDC on schedule, and maintain its own coherent data model that maps concepts from both.

```
CAP Consolidated Domain Model
--------------------------------
Customer
  ├── Orders[]
  │     └── OrderLine[]
  └── RevenueMetrics[]

Product
  ├── PriceHistory[]
  └── InventoryPosition[]
```

Notice that `Customer` in CAP maps to `BusinessPartner` in S4HC and `CustomerDimension` in BDC. `Orders` maps to `SalesOrder`. `RevenueMetrics` comes from BDC's `RevenueItem`. The CAP model is the shared language between the source systems and the application's consumers.

---

## The Integration Architecture

Here's the full picture before drilling into each piece:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CAP Application                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Event Handler│  │  Job Scheduler   │  │  Domain Service  │   │
│  │  (S4HC)      │  │  Handler (BDC)   │  │  (consumers)     │   │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘   │
│         │                   │                      │             │
│  ┌──────▼───────────────────▼──────────────────────▼──────────┐  │
│  │                     Adapter Layer                           │  │
│  │   S4HC Adapter          BDC Adapter         Domain Mapper   │  │
│  └──────┬───────────────────┬─────────────────────────────────┘  │
│         │                   │                                     │
│  ┌──────▼───────────────────▼────────────────────────────────┐   │
│  │                   CAP Database (HANA / SQLite)              │   │
│  │   CAP Domain Entities + Outbox Table + Sync State Table    │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────┬───────────────────────────────────────────────────────┘
           │                          ▲
           │ events                   │ batch pull
           ▼                          │
    ┌─────────────┐          ┌─────────────────┐
    │  SAP Event  │          │   SAP Business  │
    │    Mesh     │          │   Data Cloud    │
    └──────┬──────┘          └─────────────────┘
           │
    ┌──────▼──────┐
    │  SAP S/4HC  │
    └─────────────┘
```

The three main integration paths are:

1. **Event path**: S4HC → Event Mesh → CAP Event Handler → Adapter → Domain entities
2. **Batch path**: BDC ← CAP Job (triggered by Job Scheduling Service) → Adapter → Domain entities
3. **Serve path**: CAP Domain Service → consumers (Fiori, APIs, other apps)

---

## Pattern 1: Event-Driven Ingestion from S4HC

S4HC publishes business events to SAP Event Mesh using CloudEvents format. Your CAP app subscribes as a consumer.

### The Outbox Pattern

The first thing the event handler does is **not process the event**. It persists it to an outbox table. Processing happens asynchronously. This decouples the acknowledgment to Event Mesh from the actual business processing, which means:

- If downstream processing fails, the event is not lost
- You can retry failed events without re-subscribing to the mesh
- Event consumption is idempotent by design

```cds
// Outbox and sync state tables in CDS schema
entity EventOutbox : cuid {
  receivedAt    : Timestamp;
  eventType     : String(100);        // e.g. sap.s4.beh.salesorder.v1.SalesOrder.Created.v1
  sourceId      : String(100);        // S4HC document number
  payload       : LargeString;        // raw CloudEvents JSON
  status        : String(20);         // PENDING | PROCESSING | DONE | FAILED
  retryCount    : Integer default 0;
  processedAt   : Timestamp;
  errorMessage  : LargeString;
}

entity BDCSyncState {
  key entity   : String(50);          // which BDC entity this tracks
  lastRunAt    : Timestamp;
  lastDeltaKey : String(100);         // cursor / watermark for delta loads
  status       : String(20);          // IDLE | RUNNING | FAILED
}
```

The event handler in CAP looks like this:

```typescript
// srv/event-handler.ts
import cds from '@sap/cds';

export class S4HCEventHandler extends cds.ApplicationService {
  async init() {
    // Subscribe to Event Mesh topic
    const messaging = await cds.connect.to('messaging');

    messaging.on('sap/s4/beh/salesorder/v1/SalesOrder/Created/v1',
      async (msg) => {
        // Write to outbox immediately, acknowledge fast
        await INSERT.into('EventOutbox').entries({
          eventType: 'SalesOrder.Created',
          sourceId:  msg.data?.SalesOrder,
          payload:   JSON.stringify(msg.data),
          status:    'PENDING',
          receivedAt: new Date().toISOString()
        });
      }
    );

    messaging.on('sap/s4/beh/businesspartner/v1/BusinessPartner/Changed/v1',
      async (msg) => {
        await INSERT.into('EventOutbox').entries({
          eventType: 'BusinessPartner.Changed',
          sourceId:  msg.data?.BusinessPartner,
          payload:   JSON.stringify(msg.data),
          status:    'PENDING',
          receivedAt: new Date().toISOString()
        });
      }
    );

    await super.init();
  }
}
```

### The Event Processor (Outbox Consumer)

A separate job—triggered by the SAP BTP Job Scheduling Service—picks up `PENDING` events from the outbox and processes them through the adapter layer:

```typescript
// srv/outbox-processor.ts
export class OutboxProcessor extends cds.ApplicationService {
  async processOutbox() {
    const pending = await SELECT.from('EventOutbox')
      .where({ status: 'PENDING' })
      .orderBy('receivedAt asc')
      .limit(50); // process in batches

    for (const event of pending) {
      await UPDATE('EventOutbox')
        .set({ status: 'PROCESSING' })
        .where({ ID: event.ID });

      try {
        await this.dispatchEvent(event);
        await UPDATE('EventOutbox')
          .set({ status: 'DONE', processedAt: new Date().toISOString() })
          .where({ ID: event.ID });

      } catch (err) {
        const retries = (event.retryCount || 0) + 1;
        await UPDATE('EventOutbox').set({
          status:       retries >= 3 ? 'FAILED' : 'PENDING',
          retryCount:   retries,
          errorMessage: err.message
        }).where({ ID: event.ID });
      }
    }
  }

  private async dispatchEvent(event) {
    const payload = JSON.parse(event.payload);
    switch (event.eventType) {
      case 'SalesOrder.Created':
        return this.handleSalesOrderCreated(payload);
      case 'BusinessPartner.Changed':
        return this.handleBusinessPartnerChanged(payload);
    }
  }

  private async handleSalesOrderCreated(payload) {
    // Pull full data from S4HC OData API (event only has key fields)
    const s4hc = await cds.connect.to('S4HC_API_SALES_ORDER_SRV');
    const salesOrder = await s4hc.run(
      SELECT.one.from('A_SalesOrder')
        .where({ SalesOrder: payload.SalesOrder })
        .columns(['SalesOrder','SoldToParty','TotalNetAmount','TransactionCurrency'])
    );

    // Map through adapter to CAP domain model
    const mapped = S4HCAdapter.toOrder(salesOrder);

    // Upsert into CAP domain entities
    await UPSERT.into('Orders').entries(mapped);
  }
}
```

---

## Pattern 2: The Adapter Layer

Each source system has a dedicated adapter. The adapter's sole job is **data model translation**—no business logic, no side effects. It takes a source record and returns a CAP domain entity.

This is where the three data models are bridged.

```typescript
// srv/adapters/s4hc-adapter.ts
export class S4HCAdapter {

  static toCustomer(bp: S4HCBusinessPartner): CAPCustomer {
    return {
      ID:          bp.BusinessPartner,            // key mapping
      externalId:  bp.BusinessPartner,
      name:        bp.BusinessPartnerFullName,
      type:        bp.BusinessPartnerCategory === '1' ? 'PERSON' : 'ORGANIZATION',
      country:     bp.CorrespondenceLanguage,
      // S4HC has no 'tier' concept — default, will be enriched by BDC
      tier:        undefined,
      sourceSystem: 'S4HC'
    };
  }

  static toOrder(so: S4HCSalesOrder): CAPOrder {
    return {
      ID:           so.SalesOrder,
      externalId:   so.SalesOrder,
      customer_ID:  so.SoldToParty,
      netAmount:    parseFloat(so.TotalNetAmount),
      currency:     so.TransactionCurrency,
      sourceSystem: 'S4HC'
    };
  }
}
```

```typescript
// srv/adapters/bdc-adapter.ts
export class BDCAdapter {

  static enrichCustomer(dim: BDCCustomerDimension): Partial<CAPCustomer> {
    // BDC adds analytics enrichment to existing CAP records
    return {
      ID:             dim.CustomerKey,            // must match S4HC BP number
      segment:        dim.CustomerSegment,
      tier:           dim.CustomerTier,           // this comes only from BDC
      lifetimeValue:  dim.LifetimeRevenueAmount,
      lastOrderDate:  dim.LastTransactionDate
    };
  }

  static toRevenueMetric(fact: BDCRevenueItem): CAPRevenueMetrics {
    return {
      customer_ID:    fact.CustomerKey,
      period:         fact.FiscalPeriod,
      revenue:        fact.NetRevenue,
      grossMargin:    fact.GrossMarginAmount,
      currency:       fact.Currency
    };
  }
}
```

The key design decision here: **adapters only transform, never fetch**. They receive raw source data and return CAP-shaped data. This keeps them testable in isolation with no external dependencies.

---

## Pattern 3: Batch Ingestion from BDC with Job Scheduler

BDC integration is pull-based. The CAP app connects to BDC APIs on a schedule managed by the SAP BTP Job Scheduling Service.

### Delta Loads with Watermarks

Rather than full table scans, each BDC job uses a **watermark** stored in `BDCSyncState`. The watermark is a cursor—typically a timestamp or a delta token—that marks where the last successful run ended.

```typescript
// srv/bdc-sync.ts
export class BDCSyncService extends cds.ApplicationService {

  async syncCustomerDimensions() {
    const state = await SELECT.one.from('BDCSyncState')
      .where({ entity: 'CustomerDimension' });

    const lastRun = state?.lastRunAt ?? '2000-01-01T00:00:00Z';

    // Mark job as running
    await UPSERT.into('BDCSyncState').entries({
      entity: 'CustomerDimension',
      status: 'RUNNING',
      lastRunAt: new Date().toISOString()
    });

    try {
      const bdc = await cds.connect.to('BDC_API');

      // Delta load: only records changed since last run
      const dimensions = await bdc.run(
        SELECT.from('CustomerDimension')
          .where({ ChangedAt: { '>=': lastRun } })
          .limit(1000)
      );

      for (const dim of dimensions) {
        const enrichment = BDCAdapter.enrichCustomer(dim);
        // Merge into existing CAP Customer record
        await UPDATE('Customers')
          .set(enrichment)
          .where({ ID: enrichment.ID });
      }

      await UPDATE('BDCSyncState').set({
        status: 'IDLE',
        lastRunAt: new Date().toISOString()
      }).where({ entity: 'CustomerDimension' });

    } catch (err) {
      await UPDATE('BDCSyncState').set({
        status: 'FAILED'
      }).where({ entity: 'CustomerDimension' });
      throw err;
    }
  }

  async syncRevenueMetrics() {
    // Same pattern — pull BDC revenue facts, map via BDCAdapter, upsert
    const bdc = await cds.connect.to('BDC_API');
    const facts = await bdc.run(
      SELECT.from('RevenueItem')
        .where({ FiscalPeriod: this.currentFiscalPeriod() })
    );

    const metrics = facts.map(BDCAdapter.toRevenueMetric);
    await UPSERT.into('RevenueMetrics').entries(metrics);
  }
}
```

### Job Scheduling Service Registration

The job endpoints are exposed as CAP actions and registered in the SAP BTP Job Scheduling Service:

```cds
// srv/admin-service.cds
service AdminService @(requires: 'system-user') {
  action syncBDCCustomers()  returns String;
  action syncBDCRevenue()    returns String;
  action processOutbox()     returns String;
}
```

```typescript
// srv/admin-service.ts
export class AdminService extends cds.ApplicationService {
  async init() {
    this.on('syncBDCCustomers', async () => {
      await new BDCSyncService().syncCustomerDimensions();
      return 'OK';
    });

    this.on('syncBDCRevenue', async () => {
      await new BDCSyncService().syncRevenueMetrics();
      return 'OK';
    });

    this.on('processOutbox', async () => {
      await new OutboxProcessor().processOutbox();
      return 'OK';
    });

    await super.init();
  }
}
```

The Job Scheduling Service calls these endpoints on their respective schedules—outbox processing every few minutes, BDC dimension sync nightly, revenue metrics sync hourly during business hours.

---

## The CAP Consolidated Data Model

This is the model that consumers see. It's deliberately decoupled from both S4HC's transactional structure and BDC's analytical structure.

```cds
// db/schema.cds
namespace com.myapp.domain;

using { cuid, managed } from '@sap/cds/common';

entity Customers : cuid, managed {
  externalId    : String(20);    // maps to S4HC BusinessPartner
  name          : String(200);
  type          : String(20);    // PERSON | ORGANIZATION
  country       : String(3);
  segment       : String(50);    // enriched by BDC
  tier          : String(20);    // enriched by BDC
  lifetimeValue : Decimal(18,2); // enriched by BDC
  lastOrderDate : Date;          // enriched by BDC
  sourceSystem  : String(10);    // S4HC | BDC | MANUAL
  orders        : Composition of many Orders on orders.customer = $self;
  metrics       : Composition of many RevenueMetrics on metrics.customer = $self;
}

entity Orders : cuid, managed {
  externalId   : String(20);    // maps to S4HC SalesOrder
  customer     : Association to Customers;
  netAmount    : Decimal(18,2);
  currency     : String(3);
  status       : String(20);
  sourceSystem : String(10);
  lines        : Composition of many OrderLines on lines.order = $self;
}

entity OrderLines : cuid {
  order       : Association to Orders;
  externalId  : String(20);    // maps to S4HC SalesOrderItem
  product     : String(50);
  quantity    : Decimal(13,3);
  netAmount   : Decimal(18,2);
}

entity RevenueMetrics : cuid {
  customer    : Association to Customers;
  period      : String(7);     // YYYY-MM
  revenue     : Decimal(18,2);
  grossMargin : Decimal(18,2);
  currency    : String(3);
  sourceSystem: String(10);    // always BDC
}

// Integration infrastructure
entity EventOutbox : cuid {
  receivedAt   : Timestamp;
  eventType    : String(100);
  sourceId     : String(100);
  payload      : LargeString;
  status       : String(20);
  retryCount   : Integer default 0;
  processedAt  : Timestamp;
  errorMessage : LargeString;
}

entity BDCSyncState {
  key entity   : String(50);
  lastRunAt    : Timestamp;
  lastDeltaKey : String(100);
  status       : String(20);
}
```

The key insight in this model: `Customer` holds fields that come from two different systems. `externalId` comes from S4HC's BusinessPartner key. `tier` and `lifetimeValue` come from BDC. The CAP model doesn't know or care—it just holds the consolidated truth.

---

## Handling Data Conflicts

When S4HC and BDC both provide data about the same entity, you need a conflict resolution strategy. I use a simple **source priority** rule encoded per-field:

```typescript
// srv/conflict-resolver.ts
export class ConflictResolver {

  // Fields where S4HC is authoritative (transactional truth)
  static readonly S4HC_OWNS = ['name', 'type', 'country', 'status'];

  // Fields where BDC is authoritative (analytical truth)
  static readonly BDC_OWNS = ['segment', 'tier', 'lifetimeValue', 'lastOrderDate'];

  static mergeCustomer(
    existing: CAPCustomer,
    s4hcData?: Partial<CAPCustomer>,
    bdcData?: Partial<CAPCustomer>
  ): CAPCustomer {
    const result = { ...existing };

    // S4HC writes win for its fields
    if (s4hcData) {
      for (const field of this.S4HC_OWNS) {
        if (s4hcData[field] !== undefined) {
          result[field] = s4hcData[field];
        }
      }
    }

    // BDC writes win for its fields
    if (bdcData) {
      for (const field of this.BDC_OWNS) {
        if (bdcData[field] !== undefined) {
          result[field] = bdcData[field];
        }
      }
    }

    return result;
  }
}
```

This is simple and intentional. More sophisticated conflict resolution—last-write-wins with timestamps, or domain-specific rules—is easy to add per entity type without changing the integration infrastructure.

---

## Putting It Together: the Data Flow

A concrete sequence to make this tangible:

**1. Customer record created in S4HC**
- S4HC publishes `BusinessPartner.Created` event to Event Mesh
- CAP event handler writes it to `EventOutbox` (PENDING)
- Outbox processor picks it up, calls S4HC OData API to fetch full BP data
- `S4HCAdapter.toCustomer()` maps it to a `Customer` entity
- Record upserted into CAP `Customers` table: name, type, country populated; segment and tier are empty

**2. Nightly BDC dimension sync runs**
- Job Scheduling Service calls `syncBDCCustomers`
- BDC query returns `CustomerDimension` records including segment, tier, lifetimeValue
- `BDCAdapter.enrichCustomer()` maps analytics fields
- CAP `Customers` records updated: segment and tier now populated
- `BDCSyncState` watermark advanced

**3. Consumer reads the customer**
- CAP domain service returns the `Customer` record
- Consumer sees a unified entity with transactional fields from S4HC and analytical enrichment from BDC
- Neither source system's internal data model is visible to the consumer

---

## Why This Architecture

A few tradeoffs worth naming explicitly.

**CAP owns the consolidated model, not either source system.** This means when S4HC changes its BusinessPartner structure, or BDC renames a dimension, only the adapter changes—not the domain model, not the consumers. The adapter is the firewall.

**The outbox decouples reliability from latency.** Events are acknowledged fast and processed reliably. If the BTP instance restarts mid-processing, the outbox table retains the state and processing resumes. Without an outbox, event loss is your problem on every deployment or crash.

**Job scheduler controls BDC cadence, not CAP.** CAP doesn't have internal crons. The Job Scheduling Service is the right tool for this—it handles retries, monitoring, distributed locking, and scheduling across multiple app instances.

**Three data models coexist permanently.** This is the uncomfortable truth of enterprise integration: you rarely get to rationalize the source systems. The best you can do is make the translation layer thin, explicit, and well-tested—which is exactly what the adapter pattern gives you.

---

If you're building something similar, the piece I'd start with is the `EventOutbox` table and the adapter for whichever source system changes most frequently. Get that path working and tested first, then add the batch path. The consolidation model becomes clearer once you've seen real data flow through both integrations.

---

## Rules for AI Code Assistants (S4HC + BDC + CAP Integration)

```
# S4HC + BDC + CAP Integration Patterns

## Event-Driven Path (S4HC → CAP)
- Events arrive via SAP Event Mesh (CloudEvents format)
- ALWAYS write to EventOutbox first — never process synchronously in the event handler
- Outbox processor runs on a separate job (Job Scheduling Service)
- S4HC events carry only key fields — fetch full data via OData API in the processor
- Use UPSERT for idempotent ingestion

## Batch Path (BDC → CAP)
- BDC sync triggered by Job Scheduling Service, not by CAP internal scheduler
- Use BDCSyncState table to track watermarks / delta cursors per entity type
- BDC enriches existing CAP records — it does not replace S4HC data
- Delta loads preferred over full loads — always use a watermark

## Adapter Layer
- One adapter class per source system: S4HCAdapter, BDCAdapter
- Adapters transform only — no fetching, no business logic, no side effects
- Field-level source ownership: S4HC owns transactional fields, BDC owns analytical fields
- ConflictResolver handles merging when both systems provide data for same entity

## CAP Domain Model
- Domain model is independent of source system schemas
- externalId fields carry source system keys for traceability
- sourceSystem field indicates where the record originated
- EventOutbox and BDCSyncState are infrastructure entities — do not expose in domain service

## Key Rules
- Job Scheduling Service endpoints are AdminService actions protected by system-user role
- Outbox retries up to 3 times before marking FAILED — do not silently swallow errors
- BDCSyncState status must be reset from RUNNING on job completion (success or failure)
- Adapters receive raw source data as input — they do not call external APIs
```
