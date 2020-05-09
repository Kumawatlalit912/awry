import { URL, URLSearchParams } from "url";
import ARIWebSocket from "./ARIWebSocket";

/**
 * Client for interacting with the Asterisk REST Interface server-sent events.
 */
export default class Events {
  /**
   * Connect to Asterisk's event endpoint via websocket, and return an
   * EventEmitter that can be used to listen for events coming from Asterisk.
   *
   * @param {object} params
   * @param {string|Array.<string>} params.app The app[s] to receive events for.
   * @param {string} params.url The ARI events url with 'ws' or 'wss' protocol,
   *  i.e. 'ws://asterisk.local:8088/ari/events'
   * @param {string} params.username The username to use for the connection
   * @param {string} params.password The password to use for the connection
   * @param {boolean} [params.subscribeAll=true] Whether or not to subscribe
   *  to all system events. When set to false, explicit subscription
   *  requests must be made to the ARI events endpoint to receive events for
   *  individual event sources on a given application. *Param available since
   *  Asterisk 13.6*
   * @param {boolean} [params.reconnect=true] Whether to reconnect to the
   *  ARI events endpoint upon unsolicited disconnect.
   * @param {object} [params.retryOptions={ maxTimeout: 60000 }] Any
   *  advanced options to pass to the 'node-retry' retry.operation() method.
   * @param {object} [params.wsOptions={}] Any advanced options to pass
   *  directly to the 'ws' library constructor.
   * @returns {ARIWebSocket}
   */
  static connect(params) {
    const {
      app,
      url: userProvidedUrl,
      username,
      password,
      subscribeAll = true,
      reconnect = true,
      retryOptions = { maxTimeout: 60000 },
      wsOptions = {},
    } = params;

    const parsedUrl = new URL(userProvidedUrl);

    const newSearchParams = new URLSearchParams(parsedUrl.searchParams);
    newSearchParams.set("api_key", `${username}:${password}`);
    newSearchParams.set("app", [].concat(app).join(","));
    newSearchParams.set("subscribeAll", subscribeAll ? "true" : "false");
    parsedUrl.search = newSearchParams.toString();

    const wsUrl = parsedUrl.href;

    return new ARIWebSocket({
      url: wsUrl,
      reconnect,
      retryOptions,
      wsOptions,
    });
  }
}
