---
layout: post
title: "Custom Handlers for Draft Entities in SAP CAP"
date: 2026-01-15 16:30:00 +0100
categories: sap cap tech
---

# Custom Handlers for Draft Entities in SAP CAP

The first time I faced a two-level composition hierarchy with draft-enabled entities in a CAP project, I stared at my screen wondering which custom handlers I actually needed to implement. The Fiori Elements UI works beautifully out of the box—users can create, edit, save, and discard changes without any custom code. But the moment you need business logic, validations, or calculations, you realize you're dancing with an intricate system of events that needs careful choreography.

In this post, I'll walk through each Fiori Elements action and explain exactly what custom handlers you need to implement for a draft-enabled entity with nested compositions. My mind loves finding patterns, and CAP's draft system is essentially a beautiful pattern that becomes clearer once you understand the rhythm.

## Understanding the Scenario

Let's establish our data model first. We have:

- **Entity A**: Draft-enabled parent entity
- **Entity B**: Composition of Entity A (automatically draft-enabled)

Here's the critical insight: **when a parent entity is draft-enabled, all compositions in the hierarchy automatically inherit draft behavior**. There's no such thing as mixing draft and non-draft entities in a composition tree—CAP handles the entire hierarchy as one cohesive draft unit.

This means when a user edits Entity A, CAP creates draft copies of all related Entity B records. When they activate (save) the draft, all changes across the hierarchy are committed atomically. This transactional behavior is what makes the draft system powerful, but it also means your custom handlers need to respect this hierarchy.

```
Entity A (draft-enabled)
  └── Entity B[] (composition, inherits draft)
```

## The Fiori Elements Action Lifecycle

When users interact with a Fiori Elements application, their actions trigger specific CAP events. Let's break down each action, the events it triggers, and the custom handlers you need.

### Quick Reference Matrix

| User Action | CAP Event | Target Entity | Entities Affected | When to Use Handler | Key Patterns |
|------------|-----------|---------------|-------------------|---------------------|--------------|
| **Create** (New) | `NEW` | `EntityA.drafts`, `EntityB.drafts` | EntityA draft; EntityB when adding a child row | Set defaults, initialize structure | `srv.before/after('NEW', 'EntityA.drafts')` / `srv.before/after('NEW', 'EntityB.drafts')` |
| **Edit** (Existing) | `EDIT` | `EntityA` | All entities (A, B) - active → draft copy | Validate edit allowed, enrich draft context | `srv.before/after('EDIT', 'EntityA')` |
| **Update** (Modify fields) | `PATCH` | `EntityA.drafts`, `EntityB.drafts` | Specific draft entity being changed | Field validation, calculations, cascade updates | `srv.before/after('PATCH', '*.drafts')` |
| **Save/Activate** | `SAVE` then `CREATE`/`UPDATE` | `EntityA.drafts` → `EntityA` | All entities (draft → active) | **Critical**: Validate all entities, business logic | `srv.before('SAVE', 'EntityA.drafts')` + `srv.on('CREATE'/'UPDATE', 'EntityA')` |
| **Delete** | `DELETE` | `EntityA` or `EntityA.drafts`; `EntityB.drafts` for individual child rows | All entities via cascade (root delete); specific child row | Prevent deletion, cleanup resources | `srv.before/after('DELETE', 'EntityA')` / `srv.before/after('DELETE', 'EntityB.drafts')` |
| **Cancel/Discard** | `DISCARD` | `EntityA.drafts` | All draft entities deleted | Cleanup temp resources | `srv.before/after('DISCARD', 'EntityA.drafts')` |

**Important Notes:**
- **SAVE is special**: It triggers BOTH a `SAVE` event on drafts AND either `CREATE` (for new entities) or `UPDATE` (for edited entities) on the active entity. You need handlers for all three.
- **Compositions inherit draft**: When EntityA is draft-enabled, EntityB automatically becomes draft-enabled. No way to mix draft/non-draft in a composition tree.
- **Deep operations**: CAP handles the entire hierarchy automatically during EDIT and SAVE. Trust it unless you have specific needs.
- **Use `.drafts` qualifier**: Always distinguish between `EntityA` (active) and `EntityA.drafts` (draft) in your handlers.

### Action 1: NEW (Creating a New Draft)

**User Action**: Clicks the "Create" button in the list report, or adds a new row to a composition child table

**CAP Event**: `NEW` on `EntityA.drafts` (new parent draft) or `NEW` on `EntityB.drafts` (new child row added during editing)

**Entities Affected**: EntityA draft when creating; EntityB draft when the user adds a row to the composition table

**When You Need a Handler**: To set default values, initialize related entities, or prepare the initial structure

```typescript
import { Request } from '@sap/cds';

// Fires when the user clicks "Create" in the list report
srv.before('NEW', 'EntityA.drafts', async (req: Request) => {
  // Set default values for the new draft
  req.data.status = 'NEW';
  req.data.createdBy = req.user.id;
});

srv.after('NEW', 'EntityA.drafts', async (data: EntityA, req: Request) => {
  // Enrich the created draft with calculated fields
  // or fetch additional data to display
  const { ID } = data;

  // Example: Calculate some initial values based on user context
  await UPDATE('EntityA.drafts')
    .set({ calculatedField: someCalculation() })
    .where({ ID });
});

// Fires when the user adds a new row to the EntityB composition table
// This is independent from the parent NEW — it fires on the child entity directly
srv.before('NEW', 'EntityB.drafts', async (req: Request) => {
  // Set defaults for the new child row
  req.data.position = await getNextPosition(req.data.parent_ID);
  req.data.lineStatus = 'OPEN';
});

srv.after('NEW', 'EntityB.drafts', async (data: EntityB, req: Request) => {
  // Post-process the newly created child row
  const { ID } = data;
  await UPDATE('EntityB.drafts')
    .set({ computedField: computeDefault(data) })
    .where({ ID });
});
```

### Action 2: EDIT (Editing an Active Entity)

**User Action**: Clicks the "Edit" button on an existing record

**CAP Event**: `EDIT` action on EntityA, which internally triggers draft creation

**Entities Affected**: All entities in the hierarchy (active → draft copy)

**When You Need a Handler**: To customize the draft preparation, load additional context, or handle special composition copying logic

```typescript
srv.before('EDIT', 'EntityA', async (req: Request) => {
  // Fetch the active entity before it's copied to draft
  const { ID } = req.data;
  const entity = await SELECT.one.from('EntityA').where({ ID });

  // You can perform validations before allowing edit
  if (entity.locked) {
    req.error(423, 'This entity is locked and cannot be edited');
  }
});

srv.after('EDIT', 'EntityA', async (data: EntityA, req: Request) => {
  // The draft has been created with deep copy of all compositions
  // You can now enrich the draft with additional data
  const { ID } = data;

  // Example: Load some context data into the draft
  await UPDATE('EntityA.drafts')
    .set({ editContext: 'User edited at ' + new Date().toISOString() })
    .where({ ID });

  // CAP automatically handles the deep copy of EntityB
  // You typically don't need to manually copy compositions
});
```

### Action 3: PATCH (Modifying a Draft)

**User Action**: Changes field values while editing (each field change triggers this)

**CAP Event**: `PATCH` on `EntityA.drafts` or `EntityB.drafts`

**Entities Affected**: The specific draft entity being modified

**When You Need a Handler**: For field-level validation, calculated fields, or cascading updates

```typescript
srv.before('PATCH', 'EntityA.drafts', async (req: Request) => {
  // Validate the changes before they're applied
  const { amount, currency } = req.data;

  if (amount && amount < 0) {
    req.error(400, 'Amount must be positive');
  }

  // Perform calculations based on changed fields
  if (req.data.quantity && req.data.pricePerUnit) {
    req.data.totalPrice = req.data.quantity * req.data.pricePerUnit;
  }
});

srv.after('PATCH', 'EntityA.drafts', async (data: EntityA, req: Request) => {
  // Cascade updates to child entities if needed
  const { ID } = data;

  // Example: When parent changes, update all children
  if (req.data.status) {
    await UPDATE('EntityB.drafts')
      .set({ parentStatus: req.data.status })
      .where({ parent_ID: ID });
  }
});

// Handle updates on child entities
srv.before('PATCH', 'EntityB.drafts', async (req: Request) => {
  // Validate child entity changes
  // These fire independently when users edit composition tables
  if (req.data.invalidField) {
    req.error(400, 'Invalid field value');
  }
});
```

### Action 4: SAVE/Activate (Persisting Draft Changes)

**User Action**: Clicks the "Save" button

**CAP Event**: `SAVE` on `EntityA.drafts`, which triggers either `CREATE` or `UPDATE` on the active EntityA

**Entities Affected**: All entities in the hierarchy (draft → active)

**When You Need a Handler**: This is where most business logic lives—validation, computation, and composition management

```typescript
// IMPORTANT: The SAVE handler runs on the draft entity
srv.before('SAVE', 'EntityA.drafts', async (req: Request) => {
  // This is your last chance to validate before activation
  const draft = await SELECT.one
    .from('EntityA.drafts')
    .where({ ID: req.data.ID })
    .columns(['ID', 'requiredField', 'status']);

  if (!draft.requiredField) {
    req.error(400, 'Required field is missing');
  }

  // Validate all child entities in the composition
  const childrenB: EntityB[] = await SELECT.from('EntityB.drafts')
    .where({ parent_ID: draft.ID });

  for (const childB of childrenB) {
    if (!childB.mandatoryField) {
      req.error(400, `EntityB ${childB.ID} is missing mandatory field`);
    }
  }
});

// Handle new entity creation (when activating a draft created via "Create")
srv.on('CREATE', 'EntityA', async (req: Request, next: Function) => {
  // The draft is being activated and will become a new active entity
  // CAP handles the deep insert of all compositions automatically

  // But you might need to customize the creation
  const result = await next(); // Let CAP do the default deep insert

  // Post-creation logic
  await postProcessNewEntity(result.ID);

  return result;
});

// Handle entity update (when activating a draft created via "Edit")
srv.on('UPDATE', 'EntityA', async (req: Request, next: Function) => {
  // The draft changes are being applied to the active entity
  // CAP handles the deep update of all compositions

  // You can intercept to add custom logic
  const { ID } = req.data;

  // CAP's deep update uses a "full set" approach:
  // - Existing child records not in the draft are deleted
  // - New child records in the draft are created
  // - Modified child records are updated

  const result = await next(); // Let CAP handle the deep update

  // Post-update logic
  await notifyRelatedSystems(ID);

  return result;
});

srv.after('SAVE', 'EntityA.drafts', async (data: EntityA, req: Request) => {
  // The draft has been successfully activated
  // This fires AFTER the CREATE or UPDATE completes

  // Good place for notifications, logging, or async processes
  await sendNotification({
    message: 'Entity A has been saved',
    entityId: data.ID
  });
});
```

### Action 5: DELETE (Removing an Entity)

**User Action**: Deletes a draft or active record

**CAP Event**: `DELETE` on `EntityA` or `EntityA.drafts`

**Entities Affected**: All entities in the hierarchy via cascade deletion

**When You Need a Handler**: To prevent deletion under certain conditions, clean up related data, or handle cascade manually

```typescript
srv.before('DELETE', 'EntityA', async (req: Request) => {
  // Validate deletion is allowed
  const { ID } = req.data;
  const entity = await SELECT.one.from('EntityA').where({ ID });

  if (entity.status === 'LOCKED') {
    req.error(403, 'Cannot delete locked entities');
  }

  // CAP will automatically cascade delete to EntityB
  // due to the composition relationship

  // But you might want to clean up related data outside the composition
  await deleteRelatedResources(ID);
});

srv.after('DELETE', 'EntityA', async (data: EntityA, req: Request) => {
  // Entity and all compositions have been deleted
  // Clean up, log, or notify
  await logDeletion(data.ID, req.user.id);
});

// Deleting the entire draft (when user deletes the whole unsaved record)
srv.before('DELETE', 'EntityA.drafts', async (req: Request) => {
  // Usually no custom logic needed here
  // CAP handles cascade deletion of draft compositions
  // But you might want to log or clean up
});

// Fires when the user removes an individual row from the EntityB composition table
// This is different from deleting the whole parent draft — it targets a specific child row
srv.before('DELETE', 'EntityB.drafts', async (req: Request) => {
  const { ID } = req.data;
  const item = await SELECT.one.from('EntityB.drafts').where({ ID });

  if (item.protected) {
    req.error(403, `Item ${item.ID} cannot be removed`);
  }
});

srv.after('DELETE', 'EntityB.drafts', async (data: EntityB, req: Request) => {
  // Child row has been removed from the draft composition
  // You might want to recalculate totals or reorder positions on the parent draft
  await recalculateTotals(data.parent_ID);
});
```

### Action 6: CANCEL (Discarding Draft Changes)

**User Action**: Clicks the "Cancel" or "Discard Draft" button

**CAP Event**: Draft discard action

**Entities Affected**: All draft entities in the hierarchy are deleted

**When You Need a Handler**: To clean up temporary data or resources created during draft editing

```typescript
srv.before('DISCARD', 'EntityA.drafts', async (req: Request) => {
  // Clean up any temporary resources or cached data
  const { ID } = req.data;

  // Example: Delete temporary files uploaded to the draft
  await cleanupTemporaryFiles(ID);

  // CAP will automatically delete all draft entities in the composition
});

srv.after('DISCARD', 'EntityA.drafts', async (data: EntityA, req: Request) => {
  // Draft has been discarded
  // Log the discard action if needed
  await logDraftDiscard(data.ID, req.user.id);
});
```

## Handlers Without Draft: The Simpler Case

To appreciate the draft choreography above, it helps to see what handlers look like for entities **without** draft enabled. The contrast is striking—no `.drafts` qualifier, no `NEW`/`EDIT`/`PATCH`/`SAVE`/`DISCARD` events. Just straightforward CRUD.

For this section, our model is:

- **Entity Z**: Non-draft parent entity
- **Entity W**: Composition of Entity Z (also non-draft)

```
Entity Z (no draft)
  └── Entity W[] (composition, also no draft)
```

### Non-Draft Quick Reference

| User Action | CAP Event | Target Entity | Key Difference from Draft |
|------------|-----------|---------------|--------------------------|
| **Create** | `CREATE` | `EntityZ` / `EntityW` | Persisted immediately, no draft step |
| **Read** | `READ` | `EntityZ` / `EntityW` | Same in both cases |
| **Update** | `UPDATE` | `EntityZ` / `EntityW` | Changes applied directly, no `PATCH` alias |
| **Delete** | `DELETE` | `EntityZ` / `EntityW` | No draft/active distinction |

### CREATE (Direct Persistence)

Without drafts, a `CREATE` event persists the entity immediately—there's no intermediary draft state. Child entities in compositions fire their own `CREATE` events independently.

```typescript
srv.before('CREATE', 'EntityZ', async (req: Request) => {
  // Validate and set defaults before the entity is persisted
  if (!req.data.requiredField) {
    req.error(400, 'Required field is missing');
  }
  req.data.status = 'NEW';
  req.data.createdBy = req.user.id;
});

srv.after('CREATE', 'EntityZ', async (data: EntityZ, req: Request) => {
  // Entity is already persisted at this point
  await sendNotification({
    message: 'Entity Z has been created',
    entityId: data.ID
  });
});

// Composition child: fires when EntityW items are created
srv.before('CREATE', 'EntityW', async (req: Request) => {
  if (!req.data.mandatoryField) {
    req.error(400, 'EntityW requires a mandatory field');
  }
});
```

### READ

Reading works the same whether the entity is draft-enabled or not. Without drafts, there's only one version of the data—no need to filter by `IsActiveEntity`.

```typescript
srv.before('READ', 'EntityZ', async (req: Request) => {
  // Apply filters, restrict access, or modify the query
  // This fires for every read request (list and detail views)
});

srv.after('READ', 'EntityZ', async (data: EntityZ[], req: Request) => {
  // Enrich the response with calculated fields
  for (const entity of data) {
    entity.displayName = `${entity.name} (${entity.status})`;
  }
});

// Composition child reads (e.g., navigating to the items table)
srv.after('READ', 'EntityW', async (data: EntityW[], req: Request) => {
  for (const item of data) {
    item.computedValue = item.quantity * item.pricePerUnit;
  }
});
```

### UPDATE (Direct Modification)

Without drafts, each `UPDATE` modifies active data immediately. There's no `PATCH` alias—just standard `UPDATE`. Child entity updates fire independently of the parent.

```typescript
srv.before('UPDATE', 'EntityZ', async (req: Request) => {
  // Validate the changes before they're applied
  if (req.data.amount && req.data.amount < 0) {
    req.error(400, 'Amount must be positive');
  }

  // Calculations based on changed fields
  if (req.data.quantity && req.data.pricePerUnit) {
    req.data.totalPrice = req.data.quantity * req.data.pricePerUnit;
  }
});

srv.after('UPDATE', 'EntityZ', async (data: EntityZ, req: Request) => {
  // Changes are already persisted
  await notifyRelatedSystems(data.ID);
});

// Composition child: fires when EntityW items are individually updated
srv.before('UPDATE', 'EntityW', async (req: Request) => {
  if (req.data.quantity && req.data.quantity < 0) {
    req.error(400, 'Quantity must be positive');
  }
});
```

### DELETE

Same event name as with drafts, but there's no draft/active distinction to worry about. CAP still cascades deletion to `EntityW` via the composition relationship.

```typescript
srv.before('DELETE', 'EntityZ', async (req: Request) => {
  const { ID } = req.data;
  const entity = await SELECT.one.from('EntityZ').where({ ID });

  if (entity.status === 'LOCKED') {
    req.error(403, 'Cannot delete locked entities');
  }
  // CAP automatically cascades deletion to EntityW via composition
});

srv.after('DELETE', 'EntityZ', async (data: EntityZ, req: Request) => {
  await logDeletion(data.ID, req.user.id);
});

// Composition child: fires when an individual EntityW item is deleted
srv.before('DELETE', 'EntityW', async (req: Request) => {
  const { ID } = req.data;
  const item = await SELECT.one.from('EntityW').where({ ID });
  if (item.protected) {
    req.error(403, 'This item cannot be deleted');
  }
});
```

### The Key Takeaway

Without drafts, the handler model is simple: **one event per operation, applied immediately to active data**. Child entities in compositions fire their own standard CRUD events — no special draft-aware event names needed.

With drafts, a single user action like "Save" triggers a multi-step choreography (`SAVE` on drafts → `CREATE`/`UPDATE` on active entities), and the child entity events change too (`PATCH` instead of `UPDATE`, `NEW` instead of `CREATE`). The draft system gives you transactional editing across an entire composition hierarchy, but that power comes with the complexity of understanding which events fire and when.

## Key Patterns & Best Practices

After working with draft-enabled compositions, here are the patterns I've found most useful:

**1. Use the `.drafts` qualifier consistently**: Always be explicit about whether you're handling drafts or active entities. `EntityA.drafts` vs `EntityA` are different entities with different behavior.

**2. Handle both CREATE and UPDATE during SAVE**: When a draft is activated, it triggers either CREATE (new entity) or UPDATE (edited entity). You need handlers for both scenarios—they're not interchangeable.

**3. Trust CAP's deep operations**: CAP automatically handles deep INSERT and UPDATE for your entire composition hierarchy. Don't try to manually manage child entities during activation unless you have specific requirements.

**4. Validate in before('SAVE')**: The SAVE event is your last checkpoint before draft activation. Put comprehensive validation here, including validation of child and grandchild entities.

**5. Manage transactions carefully**: All operations during draft activation are transactional. If you throw an error or call `req.error()`, the entire activation (including all compositions) will roll back.

**6. Use after handlers for side effects**: Send notifications, update external systems, or trigger async processes in `after` handlers. These run only after successful completion, ensuring consistency.

## Common Pitfalls

**Missing UPDATE handler during SAVE**: Many developers implement the CREATE handler for new entities but forget the UPDATE handler for edited entities. Both are triggered during SAVE depending on whether the draft is new or an edit.

**Fighting CAP's deep update strategy**: During UPDATE, CAP uses a "full set" approach—child records not present in the draft are deleted. Don't try to prevent this unless you have a specific reason; it's how draft consistency is maintained.

**Validating only the parent entity**: Remember to validate EntityB records too. The draft might contain invalid child data that will cause issues during activation.

**Ignoring transaction boundaries**: If you call external services during activation, be aware that the database transaction might roll back, but the external call won't. Use `after` handlers for non-transactional operations.

## Conclusion

The draft system in SAP CAP is a powerful pattern that becomes intuitive once you understand its rhythm. Each Fiori Elements action maps to specific CAP events, and knowing which handlers to implement—and more importantly, what to put in them—makes the difference between fighting the framework and dancing with it.

The key is remembering that draft compositions form a single transactional unit. CAP handles the complexity of coordinating changes across your hierarchy; your job is to add the business logic that makes your application unique.

What draft patterns have you found most useful in your CAP projects? I'd love to hear about the edge cases and creative solutions you've discovered.

---

## Rules for AI Code Assistants (CAP Draft)

```
# SAP CAP Draft Handler Events

## Draft root entity (EntityA.drafts)
- Create new draft    → NEW       (not CREATE)
- Edit field in draft → PATCH     (not UPDATE)
- Save/activate draft → SAVE → then CREATE (new) or UPDATE (edit) on active entity
- Edit existing       → EDIT      on active entity (not drafts)
- Discard draft       → DISCARD   (not discard)
- Delete              → DELETE    on EntityA or EntityA.drafts

## Draft composition child (EntityB.drafts) — independent from parent
- Add child row       → NEW       on EntityB.drafts
- Edit child field    → PATCH     on EntityB.drafts
- Remove child row    → DELETE    on EntityB.drafts
- No handler needed against parent; access via req.data.parent_ID if required

## Non-draft entities — standard CRUD only
- CREATE / READ / UPDATE / DELETE on the entity directly
- No .drafts qualifier, no NEW/PATCH/SAVE/EDIT/DISCARD

## Key rules
- Always use .drafts qualifier to distinguish draft from active entity
- SAVE handlers go on EntityA.drafts; activate handlers on active EntityA
- before('SAVE') is the last validation checkpoint before activation
- after() handlers are for side effects (notifications, external calls)
- All activation operations are transactional; req.error() rolls back everything
```
