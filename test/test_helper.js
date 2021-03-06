const {expect} = require('chai');
const {Namespace, DataElement, Concept, Group, Value, CodeFromValueSetValue, CodeFromAncestorValue, RefValue, OrValues, QuantifiedValue, PrimitiveIdentifier, Identifier} = require('../lib/models');

function commonTests(expectedFn, exportFn) {
  const wrappedExpectedFn = function(name, testCase) {
    try {
      return expectedFn(name);
    } catch (e) {
      const msg = `Skipping ${name} test.  Failed to load expected values: ${e}`;
      console.warn(msg);
      testCase.skip(msg);
    }
  };

  return () => {
    // Note: using ES5 function syntax instead of () => due to bug in mocha that doesn't preserve context of 'this'
    it('should correctly export a simple entry', function() {
      const ns = new Namespace('shr.test');
      addSimpleElement(ns);
      const expected = wrappedExpectedFn('Simple', this);
      const actual = exportFn(ns);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a simple entry in a different namespace', function() {
      const otherNS = new Namespace('shr.other.test');
      addSimpleElement(otherNS);
      const expected = wrappedExpectedFn('ForeignSimple', this);
      const actual = exportFn(otherNS);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a coded entry', function() {
      const ns = new Namespace('shr.test');
      addCodedElement(ns);
      const expected = wrappedExpectedFn('Coded', this);
      const actual = exportFn(ns);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a coded descendent', function() {
      const ns = new Namespace('shr.test');
      addCodedDescendentElement(ns);
      const expected = wrappedExpectedFn('CodedDescendent', this);
      const actual = exportFn(ns);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a reference entry', function() {
      const ns = new Namespace('shr.test');
      addSimpleReference(ns);
      const expected = wrappedExpectedFn('SimpleReference', this);
      const actual = exportFn(ns);
      expect(actual).to.eql(expected);
    });

    it('should correctly export an entry with an element value', function() {
      // NOTE: This is an entry where the value is not a primitive, e.g. "Value: SomeOtherDataElement"
      const ns = new Namespace('shr.test');
      addElementValue(ns);
      const expected = wrappedExpectedFn('ElementValue', this);
      const actual = exportFn(ns);
      expect(actual).to.eql(expected);
    });

    it('should correctly export an entry with an element value in a different namespace', function() {
      // NOTE: This is an entry where the value is not a primitive, e.g. "Value: SomeOtherDataElement"
      const ns = new Namespace('shr.test');
      const otherNS = new Namespace('shr.other.test');
      addForeignElementValue(ns, otherNS);
      const expected = wrappedExpectedFn('ForeignElementValue', this);
      const actual = exportFn(ns, otherNS);
      expect(actual).to.eql(expected);
    });

    it('should correctly export an entry with two-deep element value', function() {
      // NOTE: This is an entry where the value is a non-primitive, that itself has a value that is a non-primitive
      const ns = new Namespace('shr.test');
      addTwoDeepElementValue(ns);
      const expected = wrappedExpectedFn('TwoDeepElementValue', this);
      const actual = exportFn(ns);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a choice', function() {
      const ns = new Namespace('shr.test');
      addChoice(ns);
      const expected = wrappedExpectedFn('Choice');
      const actual = exportFn(ns);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a choice containing a choice', function() {
      const ns = new Namespace('shr.test');
      addChoiceOfChoice(ns);
      const expected = wrappedExpectedFn('ChoiceOfChoice', this);
      const actual = exportFn(ns);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a group', function() {
      const ns = new Namespace('shr.test');
      const otherNS = new Namespace('shr.other.test');
      addGroup(ns, otherNS);
      const expected = wrappedExpectedFn('Group', this);
      const actual = exportFn(ns, otherNS);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a group with a choice containing a choice', function() {
      const ns = new Namespace('shr.test');
      const otherNS = new Namespace('shr.other.test');
      addGroupWithChoiceOfChoice(ns, otherNS);
      const expected = wrappedExpectedFn('GroupWithChoiceOfChoice', this);
      const actual = exportFn(ns, otherNS);
      expect(actual).to.eql(expected);
    });

    it('should correctly export a group with name clashes', function() {
      const ns = new Namespace('shr.test');
      const otherNS = new Namespace('shr.other.test');
      addGroupPathClash(ns, otherNS);
      const expected = wrappedExpectedFn('GroupPathClash', this);
      const actual = exportFn(ns, otherNS);
      expect(actual).to.eql(expected);
    });
  };
}

function addGroup(ns, otherNS, addSubElements=true) {
  let gr = new Group(new Identifier(ns.namespace, 'Group'), true);
  gr.description = 'It is a group of elements';
  gr.addConcept(new Concept('http://foo.org', 'bar', 'Foobar'));
  gr.addConcept(new Concept('http://boo.org', 'far', 'Boofar'));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'Simple')), 1, 1));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'Coded')), 0, 1));
  let or = new OrValues();
  or.addValue(new QuantifiedValue(new Value(new Identifier('shr.other.test', 'Simple')), 1, 1));
  or.addValue(new QuantifiedValue(new Value(new Identifier('shr.test', 'ForeignElementValue')), 1));
  gr.addElement(new QuantifiedValue(or, 0, 2));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'ElementValue')), 0));
  ns.addDefinition(gr);
  if (addSubElements) {
    addSimpleElement(ns);
    addCodedElement(ns);
    addSimpleElement(otherNS);
    addForeignElementValue(ns, otherNS);
    addElementValue(ns);
  }
  return gr;
}

function addGroupWithChoiceOfChoice(ns, otherNS, addSubElements=true) {
  let gr = new Group(new Identifier(ns.namespace, 'GroupWithChoiceOfChoice'), true);
  gr.description = 'It is a group of elements with a choice containing a choice';
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'Simple')), 1, 1));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'Coded')), 0, 1));
  let or = new OrValues();
  or.addValue(new QuantifiedValue(new Value(new Identifier('shr.other.test', 'Simple')), 1, 1));
  let or2 = new OrValues();
  or2.addValue(new QuantifiedValue(new Value(new Identifier('shr.test', 'ForeignElementValue')), 1));
  or2.addValue(new QuantifiedValue(new Value(new Identifier('shr.test', 'ElementValue')), 1));
  or.addValue(or2);
  gr.addElement(new QuantifiedValue(or, 0, 2));
  ns.addDefinition(gr);
  if (addSubElements) {
    addSimpleElement(ns);
    addCodedElement(ns);
    addSimpleElement(otherNS);
    addForeignElementValue(ns, otherNS);
    addElementValue(ns);
  }
  return gr;
}

function addGroupPathClash(ns, nsOther, addSubElements=true) {
  let gr = new Group(new Identifier(ns.namespace, 'GroupPathClash'), true);
  gr.description = 'It is a group of elements with clashing names';
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'Simple')), 1, 1));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.other.test', 'Simple')), 0, 1));
  ns.addDefinition(gr);
  if (addSubElements) {
    addSimpleElement(ns);
    addSimpleElement(nsOther);
  }
  return gr;
}

function addSimpleElement(ns) {
  let de = new DataElement(new Identifier(ns.namespace, 'Simple'), true);
  de.description = 'It is a simple element';
  de.addConcept(new Concept('http://foo.org', 'bar', 'Foobar'));
  de.value = new Value(new PrimitiveIdentifier('string'));
  ns.addDefinition(de);
  return de;
}

function addCodedElement(ns) {
  let de = new DataElement(new Identifier(ns.namespace, 'Coded'), true);
  de.description = 'It is a coded element';
  de.value = new CodeFromValueSetValue('http://standardhealthrecord.org/test/vs/Coded');
  ns.addDefinition(de);
  return de;
}

function addCodedDescendentElement(ns) {
  let de = new DataElement(new Identifier(ns.namespace, 'CodedDescendent'), true);
  de.description = 'It is a coded element descending from foobar';
  de.value = new CodeFromAncestorValue(new Concept('http://foo.org', 'bar', 'Foobar'));
  ns.addDefinition(de);
  return de;
}

function addSimpleReference(ns) {
  let de = new DataElement(new Identifier(ns.namespace, 'SimpleReference'), true);
  de.description = 'It is a reference to a simple element';
  de.value = new RefValue(new Identifier(ns.namespace, 'Simple'));
  ns.addDefinition(de);
  return de;
}

function addTwoDeepElementValue(ns, addSubElement=true) {
  let de = new DataElement(new Identifier(ns.namespace, 'TwoDeepElementValue'), true);
  de.description = 'It is an element with a two-deep element value';
  de.value = new Value(new Identifier(ns.namespace, 'ElementValue'));
  ns.addDefinition(de);
  if (addSubElement) {
    addElementValue(ns, true);
  }
  return de;
}

function addElementValue(ns, addSubElement=true) {
  let de = new DataElement(new Identifier(ns.namespace, 'ElementValue'), true);
  de.description = 'It is an element with an element value';
  de.value = new Value(new Identifier(ns.namespace, 'Simple'));
  ns.addDefinition(de);
  if (addSubElement) {
    addSimpleElement(ns);
  }
  return de;
}

function addForeignElementValue(ns, otherNS) {
  let de = new DataElement(new Identifier(ns.namespace, 'ForeignElementValue'), true);
  de.description = 'It is an element with a foreign element value';
  de.value = new Value(new Identifier(otherNS.namespace, 'Simple'));
  ns.addDefinition(de);
  addSimpleElement(otherNS);
  return de;
}

function addChoice(ns, addSubElements=true) {
  let ch = new DataElement(new Identifier(ns.namespace, 'Choice'), true);
  ch.description = 'It is an element with a choice';
  let or = new OrValues();
  or.addValue(new Value(new PrimitiveIdentifier('string')));
  or.addValue(new QuantifiedValue(new CodeFromValueSetValue('http://standardhealthrecord.org/test/vs/CodeChoice'), 0));
  or.addValue(new QuantifiedValue(new Value(new Identifier('shr.test', 'Coded')), 1, 1));
  ch.value = or;
  ns.addDefinition(ch);
  if (addSubElements) {
    addCodedElement(ns);
  }
  return ch;
}

function addChoiceOfChoice(ns) {
  let de = new DataElement(new Identifier(ns.namespace, 'ChoiceOfChoice'), true);
  de.description = 'It is an element with a choice containing a choice';
  let or = new OrValues();
  or.addValue(new Value(new PrimitiveIdentifier('string')));
  let or2 = new OrValues();
  or2.addValue(new Value(new PrimitiveIdentifier('integer')));
  or2.addValue(new Value(new PrimitiveIdentifier('decimal')));
  or.addValue(or2);
  or.addValue(new QuantifiedValue(new CodeFromValueSetValue('http://standardhealthrecord.org/test/vs/CodeChoice'), 0));
  de.value = or;
  ns.addDefinition(de);
  return de;
}

module.exports = {commonTests};