import { RoleType } from '../UnitRole';
import Rule from '@civ-clone/core-rule/Rule';
import type Unit from '@civ-clone/core-unit/Unit';
/**
 * The role a unit type has. Validated and processed with the unit's class, never an instance, and read through
 *  `roleOf`/`hasRole`, which keep the answer per class until a `UnitRoles` rule is registered, removed or switched. So
 *  a rule's criteria and effect must depend on the class alone: never on game state (it isn't asked again when that
 *  changes), and never on roles (asking about the class being resolved throws `UnitRoleCycleError`).
 *
 * Don't subclass it: a rule of a subclass would be returned by `get(UnitRoles)`, but registering or removing one
 *  doesn't clear `RuleRegistry`'s cache for `UnitRoles`, so the roles wouldn't follow it.
 */
export declare class UnitRoles extends Rule<[typeof Unit], RoleType> {}
export default UnitRoles;
/**
 * Declares that `UnitType`, and any subclass of it, has `Role`, as one rule with the id `<idPrefix>/<UnitType>`, so a
 *  `RuleSet` can supersede the role of a single type:
 *
 * ```ts
 * ruleRegistry.register(
 *   unitRole('civ2-unit:unit/role', Pikeman, DefendRole),
 *   unitRole('civ2-unit:unit/role', Galleon, TransportRole)
 * );
 * ```
 *
 * A type has one role at most. Declaring on an abstract class gives the role to every class beneath it, so a second
 *  declaration of a *different* role on one of those classes is a conflict (`UnitRoleConflictError`, when it's asked
 *  about), not an override. Replace a role with a `RuleSet` that supersedes its rule.
 */
export declare const unitRole: (
  idPrefix: string,
  UnitType: typeof Unit,
  Role: RoleType
) => UnitRoles;
