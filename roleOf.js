"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleCriterion = exports.hasRole = exports.roleOf = exports.UnitRoleConflictError = exports.UnitRoleCycleError = void 0;
const UnitRole_1 = require("./UnitRole");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const UnitRoles_1 = require("./Rules/UnitRoles");
/** Thrown when a `UnitRoles` rule asks for the role of the class it is being resolved for. */
class UnitRoleCycleError extends Error {
}
exports.UnitRoleCycleError = UnitRoleCycleError;
/** Thrown when two `UnitRoles` rules give one unit type two different roles. */
class UnitRoleConflictError extends Error {
}
exports.UnitRoleConflictError = UnitRoleConflictError;
const memo = new WeakMap();
const build = (UnitType, rules) => {
    // Every rule validated before any is processed, as `RuleRegistry.process` does.
    const matched = rules.filter((rule) => rule.validate(UnitType));
    let role = null, declaredBy = null;
    matched.forEach((rule) => {
        var _a, _b;
        const Role = rule.process(UnitType);
        if (!(0, UnitRole_1.isRoleType)(Role)) {
            return;
        }
        if (role !== null && role !== Role) {
            throw new UnitRoleConflictError(`${UnitType.name} has two roles: ${role.name} (${(_a = declaredBy.id()) !== null && _a !== void 0 ? _a : 'a rule with no id'}) and ${Role.name} (${(_b = rule.id()) !== null && _b !== void 0 ? _b : 'a rule with no id'}). A unit type has one role: supersede one of the rules.`);
        }
        role = Role;
        declaredBy = rule;
    });
    return role;
};
const resolve = (unit, ruleRegistry) => {
    const UnitType = (typeof unit === 'function' ? unit : unit.constructor), rules = ruleRegistry.get(UnitRoles_1.default);
    let revision = memo.get(ruleRegistry);
    if (revision === undefined || revision.rules !== rules) {
        revision = { rules, byClass: new Map(), resolving: new Set() };
        memo.set(ruleRegistry, revision);
    }
    let role = revision.byClass.get(UnitType);
    if (role === undefined) {
        if (revision.resolving.has(UnitType)) {
            throw new UnitRoleCycleError(`A UnitRoles rule asked for the role of ${UnitType.name} while it was being worked out. A role ` +
                "declaration's criteria and effect must depend on the class alone, not on its (or any) role.");
        }
        revision.resolving.add(UnitType);
        try {
            role = build(UnitType, rules);
        }
        finally {
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
const roleOf = (unit, ruleRegistry) => resolve(unit, ruleRegistry);
exports.roleOf = roleOf;
/** Whether a unit, or a unit class, has `Role` (or a subclass of it) as its role. */
const hasRole = (unit, Role, ruleRegistry) => {
    const role = resolve(unit, ruleRegistry);
    return role !== null && (role === Role || role.prototype instanceof Role);
};
exports.hasRole = hasRole;
/** A criterion, for a rule whose first argument is a `Unit`, that the unit's type has `Role` in `ruleRegistry`. */
const roleCriterion = (Role, ruleRegistry) => new Criterion_1.default((unit) => (0, exports.hasRole)(unit, Role, ruleRegistry));
exports.roleCriterion = roleCriterion;
//# sourceMappingURL=roleOf.js.map