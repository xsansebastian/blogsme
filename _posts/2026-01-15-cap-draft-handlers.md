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
| **Create** (New) | `CREATE` | `EntityA.drafts` | EntityA draft only | Set defaults, initialize structure | `srv.before/after('CREATE', 'EntityA.drafts')` |
| **Edit** (Existing) | `EDIT` | `EntityA` | All entities (A, B) - active → draft copy | Validate edit allowed, enrich draft context | `srv.before/after('EDIT', 'EntityA')` |
| **Update** (Modify fields) | `UPDATE` | `EntityA.drafts`, `EntityB.drafts` | Specific draft entity being changed | Field validation, calculations, cascade updates | `srv.before/after('UPDATE', '*.drafts')` |
| **Save/Activate** | `SAVE` then `CREATE`/`UPDATE` | `EntityA.drafts` → `EntityA` | All entities (draft → active) | **Critical**: Validate all entities, business logic | `srv.before('SAVE', 'EntityA.drafts')` + `srv.on('CREATE'/'UPDATE', 'EntityA')` |
| **Delete** | `DELETE` | `EntityA` or `EntityA.drafts` | All entities via cascade | Prevent deletion, cleanup resources | `srv.before/after('DELETE', 'EntityA')` |
| **Cancel/Discard** | `discard` | `EntityA.drafts` | All draft entities deleted | Cleanup temp resources | `srv.before/after('discard', 'EntityA.drafts')` |

**Important Notes:**
- **SAVE is special**: It triggers BOTH a `SAVE` event on drafts AND either `CREATE` (for new entities) or `UPDATE` (for edited entities) on the active entity. You need handlers for all three.
- **Compositions inherit draft**: When EntityA is draft-enabled, EntityB automatically becomes draft-enabled. No way to mix draft/non-draft in a composition tree.
- **Deep operations**: CAP handles the entire hierarchy automatically during EDIT and SAVE. Trust it unless you have specific needs.
- **Use `.drafts` qualifier**: Always distinguish between `EntityA` (active) and `EntityA.drafts` (draft) in your handlers.

### Action 1: CREATE (Creating a New Draft)

**User Action**: Clicks the "Create" button in the list report

**CAP Event**: `CREATE` on `EntityA.drafts`

**Entities Affected**: EntityA draft is created with default values

**When You Need a Handler**: To set default values, initialize related entities, or prepare the initial structure

```typescript
import { Request } from '@sap/cds';

srv.before('CREATE', 'EntityA.drafts', async (req: Request) => {
  // Set default values for the new draft
  req.data.status = 'NEW';
  req.data.createdBy = req.user.id;

  // Initialize empty arrays for compositions if needed
  // CAP handles the structure, but you might want defaults
  if (!req.data.toEntityB) {
    req.data.toEntityB = [];
  }
});

srv.after('CREATE', 'EntityA.drafts', async (data: EntityA, req: Request) => {
  // Enrich the created draft with calculated fields
  // or fetch additional data to display
  const { ID } = data;

  // Example: Calculate some initial values based on user context
  await UPDATE('EntityA.drafts')
    .set({ calculatedField: someCalculation() })
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

### Action 3: UPDATE (Modifying a Draft)

**User Action**: Changes field values while editing (each field change triggers this)

**CAP Event**: `UPDATE` on `EntityA.drafts` or `EntityB.drafts`

**Entities Affected**: The specific draft entity being modified

**When You Need a Handler**: For field-level validation, calculated fields, or cascading updates

```typescript
srv.before('UPDATE', 'EntityA.drafts', async (req: Request) => {
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

srv.after('UPDATE', 'EntityA.drafts', async (data: EntityA, req: Request) => {
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
srv.before('UPDATE', 'EntityB.drafts', async (req: Request) => {
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

// Deleting drafts (when user deletes unsaved changes)
srv.before('DELETE', 'EntityA.drafts', async (req: Request) => {
  // Usually no custom logic needed here
  // CAP handles cascade deletion of draft compositions
  // But you might want to log or clean up
});
```

### Action 6: CANCEL (Discarding Draft Changes)

**User Action**: Clicks the "Cancel" or "Discard Draft" button

**CAP Event**: Draft discard action

**Entities Affected**: All draft entities in the hierarchy are deleted

**When You Need a Handler**: To clean up temporary data or resources created during draft editing

```typescript
srv.before('discard', 'EntityA.drafts', async (req: Request) => {
  // Clean up any temporary resources or cached data
  const { ID } = req.data;

  // Example: Delete temporary files uploaded to the draft
  await cleanupTemporaryFiles(ID);

  // CAP will automatically delete all draft entities in the composition
});

srv.after('discard', 'EntityA.drafts', async (data: EntityA, req: Request) => {
  // Draft has been discarded
  // Log the discard action if needed
  await logDraftDiscard(data.ID, req.user.id);
});
```

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
