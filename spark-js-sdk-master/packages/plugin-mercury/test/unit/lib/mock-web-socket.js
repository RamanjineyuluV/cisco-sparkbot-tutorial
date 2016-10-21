/**!
 *
 * Copyright (c) 2015-2016 Cisco Systems, Inc. See LICENSE file.
 */

import {EventEmitter} from 'events';
import sinon from '@ciscospark/test-helper-sinon';

/* eslint require-jsdoc: [0] */

const closeHandlers = new WeakMap();
const errorHandlers = new WeakMap();
const messageHandlers = new WeakMap();
const openHandlers = new WeakMap();

function setHandler(scope, map, type, fn) {
  const handler = map.get(scope);
  if (handler) {
    scope.removeListener(type, handler);
  }
  map.set(scope, fn);
  if (fn) {
    scope.on(type, fn);
  }
}

// eslint-disable-next-line
function noop() {};

export default class MockWebSocket extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;

    sinon.spy(this, `send`);
    sinon.spy(this, `close`);

    this.sequenceNumber = 0;

    this.on(`message`, () => {
      this.sequenceNumber += 1;
    });
  }

  get onclose() {
    return closeHandlers.get(this) || noop;
  }

  set onclose(fn) {
    setHandler(this, closeHandlers, `close`, fn);
  }

  get onerror() {
    return errorHandlers.get(this) || noop;
  }

  set onerror(fn) {
    setHandler(this, errorHandlers, `error`, fn);
  }

  get onmessage() {
    return messageHandlers.get(this) || noop;
  }

  set onmessage(fn) {
    setHandler(this, messageHandlers, `message`, fn);
  }

  get onopen() {
    return openHandlers.get(this) || noop;
  }

  set onopen(fn) {
    setHandler(this, openHandlers, `open`, fn);
  }

  close(code, reason) {
    this.readyState = 3;
    this.readyState = 4;
    this.onclose({
      code,
      reason
    });
  }

  open() {
    this.readyState = 1;
    this.emit(`open`);
  }

  send(obj) {
    try {
      obj = JSON.parse(obj);
    }
    catch (e) {
      // ignore
    }
    if (obj.type === `ping`) {
      process.nextTick(() => {
        this.emit(`message`, {
          data: JSON.stringify({
            id: obj.id,
            type: `pong`,
            sequenceNumber: this.sequenceNumber
          })
        });
      });
    }
  }

  addEventListener(...args) {
    return this.on(...args);
  }

  removeEventListener(...args) {
    return this.removeListener(...args);
  }
}
