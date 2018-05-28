/* global Symbol */
import { A } from '@ember/array';
import { buildSelector, assign } from '../../-private/helpers';
import { create } from '../../create';
import { count } from '../count';
import Ceibo from 'ceibo';

export class Collection {
  constructor(scope, definition, parent, key) {
    this.scope = scope;
    this.definition = definition || {};
    this.parent = parent;
    this.key = key;

    this._itemCounter = create({
      count: count(scope, {
        resetScope: this.definition.resetScope,
        testContainer: this.definition.testContainer
      })
    }, { parent });

    this._items = [];
  }

  get length() {
    return this._itemCounter.count;
  }

  objectAt(index) {
    let { key } = this;

    if (typeof this._items[index] === 'undefined') {
      let { scope, definition, parent } = this;
      let itemScope = buildSelector({}, scope, { at: index });

      let finalizedDefinition = assign({}, definition);

      finalizedDefinition.scope = itemScope;

      let tree = create(finalizedDefinition, { parent });

      // Change the key of the root node
      Ceibo.meta(tree).key = `${key}[${index}]`;

      this._items[index] = tree;
    }

    return this._items[index];
  }

  filter(...args) {
    return this.toArray().filter(...args);
  }

  filterBy(...args) {
    return this.toArray().filterBy(...args);
  }

  forEach(...args) {
    return this.toArray().forEach(...args);
  }

  map(...args) {
    return this.toArray().map(...args);
  }

  mapBy(...args) {
    return this.toArray().mapBy(...args);
  }

  toArray() {
    let { length } = this;

    let array = A();

    for (let i = 0; i < length; i++) {
      array.push(this.objectAt(i));
    }

    return array;
  }
}

if (typeof (Symbol) !== 'undefined' && Symbol.iterator) {
  Collection.prototype[Symbol.iterator] = function() {
    let i = 0;
    let items = this.toArray();
    let next = () => ({ done: i >= items.length, value: items[i++] });

    return { next };
  }
}

function proxyIfSupported(instance) {
  if (window.Proxy) {
    return new window.Proxy(instance, {
      get: function (target, name) {
        if (typeof (name) === 'number' || typeof (name) === 'string') {
          let index = parseInt(name, 10);

          if (!isNaN(index)) {
            return target.objectAt(index);
          }
        }

        return target[name];
      }
    });
  } else {
    return instance;
  }
}

export function collection(scope, definition) {
  let descriptor = {
    isDescriptor: true,

    get(key) {
      return proxyIfSupported(new Collection(scope, definition, this, key));
    }
  };

  return descriptor;
}
