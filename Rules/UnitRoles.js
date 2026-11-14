"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitRole = exports.UnitRoles = void 0;
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Rule_1 = require("@civ-clone/core-rule/Rule");
/**
 * The role a unit type has. Validated and processed with the unit's class, never an instance, and read through
 *  `roleOf`/`hasRole`, which keep the answer per class until a `UnitRoles` rule is registered, removed or switched. So
 *  a rule's criteria and effect must depend on the class alone: never on game state (it isn't asked again when that
 *  changes), and never on roles (asking about the class being resolved throws `UnitRoleCycleError`).
 *
 * Don't subclass it: a rule of a subclass would be returned by `get(UnitRoles)`, but registering or removing one
 *  doesn't clear `RuleRegistry`'s cache for `UnitRoles`, so the roles wouldn't follow it.
 */
class UnitRoles extends Rule_1.default {
}
exports.UnitRoles = UnitRoles;
exports.default = UnitRoles;
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
const unitRole = (idPrefix, UnitType, Role) => new UnitRoles(`${idPrefix}/${UnitType.name}`, new Criterion_1.default((Candidate) => Candidate === UnitType ||
    Object.prototype.isPrototypeOf.call(UnitType, Candidate)), new Effect_1.default(() => Role));
exports.unitRole = unitRole;
//# sourceMappingURL=UnitRoles.js.map