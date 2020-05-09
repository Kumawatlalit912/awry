import ws from "ws";
import assert from "power-assert";
import ReconnectingWebSocket from "../../src/events/ReconnectingWebSocket";
const WebSocketServer = ws.Server;

describe("ReconnectingWebSocket", () => {
  describe("by default", () => {
    let ws;
    let server;

    beforeEach(() => {
      server = new WebSocketServer({ port: 8088 });
    });

    afterEach(() => {
      // important to close client first so it does not try
      // to reconnect and cause issues in subsequent tests
      ws.close();
      server.close();
    });

    it("connects upon creation", (done) => {
      ws = new ReconnectingWebSocket({ url: "ws://localhost:8088" });
      server.on("connection", (conn) => {
        ws.on("open", () => {
          assert(conn);
          done();
        });
      });
    });

    it('emits an "open" event on connection', (done) => {
      ws = new ReconnectingWebSocket({ url: "ws://localhost:8088" });
      ws.once("open", done);
    });

    it("disconnects when close is called", (done) => {
      ws = new ReconnectingWebSocket({
        url: "ws://localhost:8088",
        reconnect: false,
      });

      server.once("connection", (conn) => {
        conn.once("close", () => {
          done();
        });
      });

      ws.once("open", () => ws.close());
    });

    it('emits a "message" event when a message is received', (done) => {
      ws = new ReconnectingWebSocket({ url: "ws://localhost:8088" });

      server.once("connection", (conn) => {
        ws.once("message", (message) => {
          assert.equal(message, "hidey ho");
          done();
        });

        conn.send("hidey ho");
      });
    });
  });

  describe("when no connection can be established on create", () => {
    let ws;
    let server;

    beforeEach(() => {
      server = new WebSocketServer({
        port: 8088,
        verifyClient: (info, verify) => {
          verify(false, 666, "fail");
        },
      });
    });

    afterEach(() => {
      // important to close client first so it does not try
      // to reconnect and cause issues in subsequent tests
      ws.close();
      server.close();
    });

    it('emits "error" event', (done) => {
      ws = new ReconnectingWebSocket({
        url: "ws://localhost:8088",
        reconnect: false,
      });

      ws.on("error", (err) => {
        assert(err);
        done();
      });
    });

    it('emits "close" event', (done) => {
      ws = new ReconnectingWebSocket({
        url: "ws://localhost:8088",
        reconnect: false,
      });

      ws.on("error", () => {});
      ws.on("close", done);
    });
  });

  describe("when an error occurs after being connected", () => {
    describe("and reconnect is disabled", () => {
      let ws;
      let server;

      beforeEach(() => {
        server = new WebSocketServer({ port: 8088 });
      });

      afterEach(() => {
        // important to close client first so it does not try
        // to reconnect and cause issues in subsequent tests
        ws.close();
        server.close();
      });

      it('emits an "error" event', (done) => {
        ws = new ReconnectingWebSocket({
          url: "ws://localhost:8088",
          reconnect: false,
        });

        ws.on("open", () => {
          // TODO: come up with a better way to emulate this
          ws._ws.emit("error", new Error("dangit"));
        });

        ws.once("error", (err) => {
          assert(err);
          done();
        });
      });

      it('emits a "close" event', (done) => {
        ws = new ReconnectingWebSocket({
          url: "ws://localhost:8088",
          reconnect: false,
        });

        ws.on("open", () => {
          // TODO: come up with a better way to emulate this
          ws._ws.emit("error", new Error("dangit"));
        });

        ws.on("error", () => {});
        ws.once("close", done);
      });
    });

    describe("and reconnect is enabled", () => {
      describe("and the server allows the reconnect", () => {
        let ws;
        let server;

        beforeEach(() => {
          server = new WebSocketServer({ port: 8088 });
        });

        afterEach(() => {
          // important to close client first so it does not try
          // to reconnect and cause issues in subsequent tests
          ws.close();
          server.close();
        });

        it("reconnects", (done) => {
          let connectCount = 0;
          let reconnected = false;

          ws = new ReconnectingWebSocket({ url: "ws://localhost:8088" });

          server.on("connection", () => {
            connectCount++;
            reconnected = connectCount === 2;
          });

          ws.on("open", () => {
            // TODO: come up with a better way to emulate this
            ws._ws.emit("error", new Error("dangit"));
          });

          ws.on("reconnected", () => {
            assert(reconnected);
            done();
          });
        });
      });

      describe("but the reconnect fails", () => {
        describe("and retries are disabled", () => {
          let ws;
          let server;

          beforeEach(() => {
            let numConnectionAttempts = 0;
            server = new WebSocketServer({
              port: 8088,
              verifyClient: (info, verify) => {
                numConnectionAttempts++;
                verify(numConnectionAttempts === 1, 666, "fail");
              },
            });
          });

          afterEach(() => {
            // important to close client first so it does not try
            // to reconnect and cause issues in subsequent tests
            ws.close();
            server.close();
          });

          it('emits an "error" event', (done) => {
            ws = new ReconnectingWebSocket({
              url: "ws://localhost:8088",
              retryOptions: { retries: 0 },
            });

            ws.on("open", () => {
              // TODO: come up with a better way to emulate this
              ws._ws.emit("error", new Error("dangit"));
            });

            ws.once("error", (err) => {
              assert(err);
              done();
            });
          });

          it('emits a "close" event', (done) => {
            ws = new ReconnectingWebSocket({
              url: "ws://localhost:8088",
              retryOptions: { retries: 0 },
            });

            ws.on("open", () => {
              // TODO: come up with a better way to emulate this
              ws._ws.emit("error", new Error("dangit"));
            });

            ws.on("error", () => {});
            ws.once("close", () => {
              done();
            });
          });
        });

        describe("but retries are enabled and the retry succeeds", () => {
          let ws;
          let server;

          beforeEach(() => {
            let numConnectionAttempts = 0;
            server = new WebSocketServer({
              port: 8088,
              verifyClient: (info, verify) => {
                numConnectionAttempts++;
                verify(numConnectionAttempts % 2 === 0, 666, "fail");
              },
            });
          });

          afterEach(() => {
            // important to close client first so it does not try
            // to reconnect and cause issues in subsequent tests
            ws.close();
            server.close();
          });

          it("reconnects", (done) => {
            ws = new ReconnectingWebSocket({
              url: "ws://localhost:8088",
              retryOptions: { retries: 1 },
            });

            ws.on("open", () => {
              // TODO: come up with a better way to emulate this
              ws._ws.emit("error", new Error("dangit"));
            });

            ws.once("reconnected", () => {
              done();
            });
          });
        });
      });
    });
  });

  describe("when the server closes the connection", () => {
    describe("and reconnect is disabled", () => {
      let ws;
      let server;

      beforeEach(() => {
        server = new WebSocketServer({ port: 8088 });
      });

      afterEach(() => {
        // important to close client first so it does not try
        // to reconnect and cause issues in subsequent tests
        ws.close();
        server.close();
      });

      it('emits a "close" event', (done) => {
        ws = new ReconnectingWebSocket({
          url: "ws://localhost:8088",
          reconnect: false,
        });

        server.once("connection", (conn) => {
          ws.once("open", () => {
            conn.close();
          });
        });

        ws.once("close", done);
      });
    });

    describe("and reconnect is enabled", () => {
      describe("and the server allows the reconnect", () => {
        let ws;
        let server;

        beforeEach(() => {
          server = new WebSocketServer({ port: 8088 });
        });

        afterEach(() => {
          // important to close client first so it does not try
          // to reconnect and cause issues in subsequent tests
          ws.close();
          server.close();
        });

        it("reconnects", (done) => {
          let connectCount = 0;
          let reconnected = false;

          ws = new ReconnectingWebSocket({ url: "ws://localhost:8088" });
          server.on("connection", (conn) => {
            connectCount++;
            reconnected = connectCount === 2;

            if (connectCount === 1) {
              ws.once("open", () => {
                conn.close();
              });
            }
          });

          ws.once("reconnected", () => {
            assert(reconnected);
            done();
          });
        });
      });

      describe("but the reconnect fails", () => {
        let ws;
        let server;

        beforeEach(() => {
          let numConnectionAttempts = 0;
          server = new WebSocketServer({
            port: 8088,
            verifyClient: (info, verify) => {
              numConnectionAttempts++;
              verify(numConnectionAttempts === 1, 666, "fail");
            },
          });
        });

        afterEach(() => {
          // important to close client first so it does not try
          // to reconnect and cause issues in subsequent tests
          ws.close();
          server.close();
        });

        it('emits an "error" event', (done) => {
          ws = new ReconnectingWebSocket({
            url: "ws://localhost:8088",
            retryOptions: { retries: 0 },
          });

          server.once("connection", (conn) => {
            ws.once("open", () => {
              conn.close();
            });
          });

          ws.once("error", (err) => {
            assert(err);
            done();
          });
        });

        it('emits a "close" event', (done) => {
          ws = new ReconnectingWebSocket({
            url: "ws://localhost:8088",
            retryOptions: { retries: 0 },
          });

          server.once("connection", (conn) => {
            ws.once("open", () => {
              conn.close();
            });
          });

          ws.on("error", () => {});
          ws.once("close", () => {
            done();
          });
        });
      });
    });
  });
});
