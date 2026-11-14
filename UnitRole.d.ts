/**
 * What a unit *type* is for: attacking, defending, carrying other units, founding cities. A game declares each of its
 *  unit types' role with a `UnitRoles` rule (see `unitRole`), so the same class can have a different role in another
 *  game, and a `RuleSet` can switch one.
 *
 * A role is data about the type for whoever chooses between types: which units become obsolete together, which are
 *  free to support, which an AI builds to defend a city or to take one. It is never what lets a unit do something:
 *  that is its domain class and its traits (`UnitTraits`, in `@civ-clone/core-unit`). A unit type has one role at most.
 *
 * Roles belong to the class, not to a unit: they are never saved and never sent to a client. A role holds nothing:
 *  the class is the role, and it is never instantiated.
 */
export declare abstract class UnitRole {}
/** A role class: what `unitRole` declares and what `roleOf` and `hasRole` answer with. */
export type RoleType<T extends UnitRole = UnitRole> = abstract new (
  ...args: any[]
) => T;
/** Whether `value` is a role class (as opposed to, say, a unit or trait class). */
export declare const isRoleType: (
  value: unknown
) => value is RoleType<UnitRole>;
export default UnitRole;
