import { RoleType, isRoleType } from './UnitRole';
import Criterion from '@civ-clone/core-rule/Criterion';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import UnitRoles from './Rules/UnitRoles';
import type Unit from '@civ-clone/core-unit/Unit';

// The same cache as `@civ-clone/core-unit`'s `traits.ts` (0.1.31), for one role per class rather than a list of traits.

type Revision = {
  // What `RuleRegistry.get(UnitRoles)` returned when this was built. `get` returns the same array until a `UnitRoles`
  //  rule is registered, unregistered or switched, so the array is the revision.
  rules: readonly UnitRoles[];
  // `null` for a class with no role, so "none" is cached as well.
  byClass: Map<Function, RoleType | null>;
  // The classes whose role is being worked out right now, to catch a declaration that asks about its own class.
  resolving: Set<Function>;
};

/** Thrown when a `UnitRoles` rule asks for the role of the class it is being resolved for. */
export class UnitRoleCycleError extends Error {}

/** Thrown when two `UnitRoles` rules give one unit type two different roles. */
export class UnitRoleConflictError extends Error {}

const memo = new WeakMap<RuleRegistry, Revision>();

const build = (
  UnitType: typeof Unit,
  rules: readonly UnitRoles[]
): RoleType | null => {
  // Every rule validated before any is processed, as `RuleRegistry.process` does.
  const matched = rules.filter((rule: UnitRoles): boolean =>
    rule.validate(UnitType)
  );

  let role: RoleType | null = null,
    declaredBy: UnitRoles | null = null;

  matched.forEach((rule: UnitRoles): void => {
    const Role = rule.process(UnitType);

    if (!isRoleType(Role)) {
      return;
    }

    if (role !== null && role !== Role) {
      throw new UnitRoleConflictError(
        `${UnitType.name} has two roles: ${role.name} (${
          declaredBy!.id() ?? 'a rule with no id'
        }) and ${Role.name} (${
          rule.id() ?? 'a rule with no id'
        }). A unit type has one role: supersede one of the rules.`
      );
    }

    role = Role;
    declaredBy = rule;
  });

  return role;
};

const resolve = (
  unit: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
): RoleType | null => {
  const UnitType = (
      typeof unit === 'function' ? unit : unit.constructor
    ) as typeof Unit,
    rules = ruleRegistry.get(UnitRoles);

  let revision = memo.get(ruleRegistry);

  if (revision === undefined || revision.rules !== rules) {
    revision = { rules, byClass: new Map(), resolving: new Set() };

    memo.set(ruleRegistry, revision);
  }

  let role = revision.byClass.get(UnitType);

  if (role === undefined) {
    if (revision.resolving.has(UnitType)) {
      throw new UnitRoleCycleError(
        `A UnitRoles rule asked for the role of ${UnitType.name} while it was being worked out. A role ` +
          "declaration's criteria and effect must depend on the class alone, not on its (or any) role."
      );
    }

    revision.resolving.add(UnitType);

    try {
      role = build(UnitType, rules);
    } finally {
      revision.resolving.delete(UnitType);
    }

    revision.byClass.set(UnitType, role);
  }

  return role;
};

/**
 * The role of a unit, or a unit class, according to the `UnitRoles` rules in `ruleRegistry`, or `null` if it has none.
 *  The registry is required: a game's own `RuleRegistry` holds its declarations, and asking another would silently
 *  find none. (Units have no `role()` of their own: pass the game's registry, as a class query does.)
 *
 * The answer is kept per class and registry until a `UnitRoles` rule changes, so a lookup allocates nothing. That is
 *  why a declaration must depend on the class alone and never on game state.
 */
export const roleOf = (
  unit: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
): RoleType | null => resolve(unit, ruleRegistry);

/** Whether a unit, or a unit class, has `Role` (or a subclass of it) as its role. */
export const hasRole = (
  unit: Unit | typeof Unit,
  Role: RoleType,
  ruleRegistry: RuleRegistry
): boolean => {
  const role = resolve(unit, ruleRegistry);

  return role !== null && (role === Role || role.prototype instanceof Role);
};

/** A criterion, for a rule whose first argument is a `Unit`, that the unit's type has `Role` in `ruleRegistry`. */
export const roleCriterion = (
  Role: RoleType,
  ruleRegistry: RuleRegistry
): Criterion =>
  new Criterion((unit: Unit): boolean => hasRole(unit, Role, ruleRegistry));
