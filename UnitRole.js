"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRoleType = exports.UnitRole = void 0;
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
class UnitRole {
}
exports.UnitRole = UnitRole;
/** Whether `value` is a role class (as opposed to, say, a unit or trait class). */
const isRoleType = (value) => typeof value === 'function' &&
    (value === UnitRole || value.prototype instanceof UnitRole);
exports.isRoleType = isRoleType;
exports.default = UnitRole;
//# sourceMappingURL=UnitRole.js.map