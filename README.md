# base-unit-role

Unit roles: what a unit *type* is for. A game declares one role per type with `UnitRoles` rules, the same way it
declares traits with `UnitTraits` (`@civ-clone/core-unit`), and asks `roleOf` or `hasRole`.

A library: it has no `main` and no `index`, so installing it registers nothing and changes no game.

## What a role is

A role says what a type is *for*, so that whoever chooses between types can compare like with like:

| Role | Types built to… |
|---|---|
| `AttackRole` | attack: take cities and destroy units |
| `DefendRole` | defend: hold cities and squares |
| `NavalSuperiorityRole` | fight other ships |
| `AirSuperiorityRole` | fight other aircraft |
| `TransportRole` | carry other units |
| `SettleRole` | found cities and work the land |
| `DiplomacyRole` | carry out diplomacy and espionage |
| `TradeRole` | trade: set up trade routes, help build wonders |

`roles` lists them in a stable order a game's rules may number them by (0 to 7). The order never changes: a new role
would go at the end.

A role is **not** what lets a unit do something. That is its domain class (`Land`, `Naval`, `Air`) and its traits:
`FoundsCities` lets a type found a city, whatever its role. A role is data for decisions that pick *between* types:

- **Obsolescence:** a type is replaced by a better type with the same role.
- **Support:** a game may make some roles free to support.
- **Choosing what to build:** an AI that wants a defender asks for `DefendRole`.

Roles, like traits, belong to the class: they are never saved and never sent to a client. A role is a class and is
never instantiated.

**One role per type.** A type has at most one role. Two declarations of the *same* role for a type (on a parent class
and a leaf, say) are fine. Two different roles throw `UnitRoleConflictError` when the type is asked about, naming both
rules. To change a role, supersede its rule with a `RuleSet`. Don't add a second declaration.

## Declaring

```ts
import { DefendRole, TransportRole } from '@civ-clone/base-unit-role/Roles';
import { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';

ruleRegistry.register(
  unitRole('civ2-unit:unit/role', Pikeman, DefendRole),
  unitRole('civ2-unit:unit/role', Galleon, TransportRole)
);
```

`unitRole` makes one `UnitRoles` rule, with the id `<prefix>/<UnitType>`. A variant rule set can then replace a single
type's role with `supersedes: ['civ2-unit:unit/role/Pikeman']`. A role declared on an abstract class applies to every
class beneath it.

The id uses the class's `name`, as `unitTraits`' ids do. So two classes with the same name (an anonymous class's name is
`''`) declared under one prefix make two rules with one id, and registering both throws `DuplicateRuleIdError`. Give
each a prefix of its own.

**How civ2-unit will declare them:** from its unit table, the same table that holds each type's numbers and traits.
Each of its 51 types gets one `unitRole(...)`, registered in `registerRules` before any rule that reads roles (the
obsolescence rules, the support exemption). civ2-unit's tests should assert that every type it registers resolves to
exactly one role. Civ1 declares no roles, so nothing changes for a Civ1 game.

## Asking

```ts
import { hasRole, roleOf, roleCriterion } from '@civ-clone/base-unit-role/roleOf';

roleOf(Pikeman, game.rules); // DefendRole, or null for a type with no role
hasRole(unit, DefendRole, game.rules); // a unit or a class; a subclass of the role counts
new Rule(roleCriterion(TradeRole, ruleRegistry) /* , … */);
```

The registry is always given. A unit's own registry is private to `core-unit`, and asking any other registry would
silently find no roles.

**How simple-ai-client might read them later:** today the AI uses proxies such as "has `Fortifies` and defence > 0"
(`lib/City/defence.ts`'s `isDefenderType`). With roles it can ask `hasRole(UnitType, DefendRole, ruleRegistry)` when
choosing what to build, and fall back to the proxy for a type with no role (`roleOf(...) === null`), which is every
Civ1 type. So the Civ1 arena stays identical until Civ1 declares roles of its own, if it ever does. The same applies to
attackers, ferries (`TransportRole`), settlers and caravans. The AI imports only this package and the role classes,
never a game's unit classes.

## The cache

This is the design of `core-unit`'s trait lookup (`traits.ts`, 0.1.31), unchanged:

- The cache is a `WeakMap` from `RuleRegistry` to the array `ruleRegistry.get(UnitRoles)` returned. `get` hands back
  that same array until a `UnitRoles` rule is registered, removed or switched, so the array's identity is the
  revision.
- Inside, a `Map` holds each class's role, or `null` for none.
- A warm lookup costs `RuleRegistry.get`, one `WeakMap.get` and one `Map.get`, and allocates nothing.
- Switching a rule set that touches no `UnitRoles` rule keeps the cache.

A declaration's criteria and effect must therefore depend on the class alone. A declaration that asks for its own
class's role throws `UnitRoleCycleError` rather than recursing.

A "last registry asked" short-cut in front of the `WeakMap` was tried for traits and not shipped, so it isn't here
either. `npm run bench` (`bench/roleLookup.ts`) logs the cost against `instanceof` and against a trait
lookup. It asserts nothing about time.
