import { AttackRole, DefendRole, SettleRole, TransportRole } from '../Roles';
import { hasRole, roleOf } from '../roleOf';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitTrait from '@civ-clone/core-unit/UnitTrait';
import { expect } from 'chai';
import { hasTrait } from '@civ-clone/core-unit/traits';
import { unitRole } from '../Rules/UnitRoles';
import { unitTraits } from '@civ-clone/core-unit/Rules/UnitTraits';

// `npm run bench`, not part of `npm test`. It logs what a role lookup costs against the `instanceof` it would replace,
//  and against a trait lookup (`@civ-clone/core-unit`'s `hasTrait`, the same cache), so a change to the lookup can be
//  compared; it asserts only that all of them give the same answers, never a timing. Shaped like Civ2: 51 unit classes
//  under three domain classes, one role each. Run it in its own process: timing several fixtures in one
//  process can skew the later ones.
describe('unit roles: lookup timings (logged, not asserted)', (): void => {
  class Land extends Unit {}
  class Naval extends Unit {}
  class Air extends Unit {}
  // The class a role would otherwise be tested with: an abstract "defender" class under Land.
  class Defender extends Land {}

  const leaf = (Parent: typeof Unit, count: number): (typeof Unit)[] =>
    Array.from({ length: count }, () => class extends Parent {});

  const defenders = leaf(Defender, 12),
    attackers = leaf(Land, 20),
    settlers = leaf(Land, 2),
    navy = leaf(Naval, 11),
    aircraft = leaf(Air, 6),
    classes = [...defenders, ...attackers, ...settlers, ...navy, ...aircraft];

  class DefendTrait extends UnitTrait {}

  const ruleRegistry = new RuleRegistry();

  // The leaf classes are anonymous, so each gets its own prefix: an id is `<prefix>/<class name>`.
  const declare = (types: (typeof Unit)[], Role: typeof DefendRole): void =>
    types.forEach((UnitType, index) =>
      ruleRegistry.register(
        unitRole(`bench/${Role.name}/${index}`, UnitType, Role)
      )
    );

  declare(defenders, DefendRole);
  declare(attackers, AttackRole);
  declare(settlers, SettleRole);
  declare([...navy, ...aircraft], TransportRole);
  defenders.forEach((UnitType, index) =>
    ruleRegistry.register(
      ...unitTraits(`bench/${index}`, UnitType, DefendTrait)
    )
  );

  // Only the class matters to every check timed here.
  const units: Unit[] = classes.map((UnitType) =>
    Object.create(UnitType.prototype)
  );

  const time = (label: string, check: (unit: Unit) => boolean): number => {
    const iterations = 1_000_000;
    let found = 0;

    // Warm up, then measure.
    for (let index = 0; index < 100_000; index++) {
      if (check(units[index % units.length])) {
        found++;
      }
    }

    found = 0;

    const start = process.hrtime.bigint();

    for (let index = 0; index < iterations; index++) {
      if (check(units[index % units.length])) {
        found++;
      }
    }

    const nanoseconds = Number(process.hrtime.bigint() - start);

    console.log(
      `      ${label}: ${(nanoseconds / 1e6).toFixed(1)} ms per 1M (${(
        nanoseconds / iterations
      ).toFixed(1)} ns each), ${found} true`
    );

    return found;
  };

  it('should give the same answers as `instanceof`, and log how long each took', (): void => {
    const byClass = time(
        'instanceof Defender',
        (unit) => unit instanceof Defender
      ),
      byRole = time('hasRole(unit, DefendRole, registry)', (unit) =>
        hasRole(unit, DefendRole, ruleRegistry)
      ),
      byRoleOf = time(
        'roleOf(unit, registry) === DefendRole',
        (unit) => roleOf(unit, ruleRegistry) === DefendRole
      ),
      byClassQuery = time('hasRole(Class, DefendRole, registry)', (unit) =>
        hasRole(unit.constructor as typeof Unit, DefendRole, ruleRegistry)
      ),
      byTrait = time('hasTrait(unit, DefendTrait, registry)', (unit) =>
        hasTrait(unit, DefendTrait, ruleRegistry)
      );

    // The same answers, so the comparison is fair.
    expect(byRole).to.equal(byClass);
    expect(byRoleOf).to.equal(byClass);
    expect(byClassQuery).to.equal(byClass);
    expect(byTrait).to.equal(byClass);
  });
});
