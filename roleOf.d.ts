import { RoleType } from './UnitRole';
import Criterion from '@civ-clone/core-rule/Criterion';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import type Unit from '@civ-clone/core-unit/Unit';
/** Thrown when a `UnitRoles` rule asks for the role of the class it is being resolved for. */
export declare class UnitRoleCycleError extends Error {}
/** Thrown when two `UnitRoles` rules give one unit type two different roles. */
export declare class UnitRoleConflictError extends Error {}
/**
 * The role of a unit, or a unit class, according to the `UnitRoles` rules in `ruleRegistry`, or `null` if it has none.
 *  The registry is required: a game's own `RuleRegistry` holds its declarations, and asking another would silently
 *  find none. (Units have no `role()` of their own: pass the game's registry, as a class query does.)
 *
 * The answer is kept per class and registry until a `UnitRoles` rule changes, so a lookup allocates nothing. That is
 *  why a declaration must depend on the class alone and never on game state.
 */
export declare const roleOf: (
  unit: Unit | typeof Unit,
  ruleRegistry: RuleRegistry
) => RoleType | null;
/** Whether a unit, or a unit class, has `Role` (or a subclass of it) as its role. */
export declare const hasRole: (
  unit: Unit | typeof Unit,
  Role: RoleType,
  ruleRegistry: RuleRegistry
) => boolean;
/** A criterion, for a rule whose first argument is a `Unit`, that the unit's type has `Role` in `ruleRegistry`. */
export declare const roleCriterion: (
  Role: RoleType,
  ruleRegistry: RuleRegistry
) => Criterion;
