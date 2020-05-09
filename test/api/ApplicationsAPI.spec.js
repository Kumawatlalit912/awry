import nock from "nock";
import ApplicationsAPI from "../../src/api/ApplicationsAPI";

describe("the Applications API", () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.enableNetConnect();
  });

  describe("list method", () => {
    describe("always", () => {
      it("makes a GET request to /applications", () => {
        const mock = nock("http://fake.local")
          .get("/ari/applications")
          .reply(200, { foo: "bar" });

        const api = new ApplicationsAPI({
          baseUrl: "http://fake.local/ari",
          username: "foo",
          password: "bar",
        });

        return api.list().then(() => {
          mock.done();
        });
      });

      it("sends the username and password", () => {
        const mock = nock("http://fake.local", {
          reqheaders: {
            authorization: "Basic Zm9vOmJhcg==",
          },
        })
          .get("/ari/applications")
          .reply(200, { foo: "bar" });

        const api = new ApplicationsAPI({
          baseUrl: "http://fake.local/ari",
          username: "foo",
          password: "bar",
        });

        return api.list().then(() => {
          mock.done();
        });
      });

      it("sets the accept header as json", () => {
        const mock = nock("http://fake.local", {
          reqHeaders: {
            accept: "application/json",
          },
        })
          .get("/ari/applications")
          .reply(200, { foo: "bar" });

        const api = new ApplicationsAPI({
          baseUrl: "http://fake.local/ari",
          username: "foo",
          password: "bar",
        });

        return api.list().then(() => {
          mock.done();
        });
      });
    });
  });

  describe("get method", () => {
    it("makes the right request", () => {
      const mock = nock("http://fake.local")
        .get("/ari/applications/foo")
        .reply(200, { foo: "bar" });

      const api = new ApplicationsAPI({
        baseUrl: "http://fake.local/ari",
        username: "foo",
        password: "bar",
      });

      return api.get({ applicationName: "foo" }).then(() => {
        mock.done();
      });
    });
  });

  describe("subscribe method", () => {
    it("makes the right request", () => {
      const mock = nock("http://fake.local")
        .post("/ari/applications/foo/subscription")
        .query({ eventSource: "device234" })
        .reply(200, { foo: "bar" });

      const api = new ApplicationsAPI({
        baseUrl: "http://fake.local/ari",
        username: "foo",
        password: "bar",
      });

      return api
        .subscribe({
          applicationName: "foo",
          eventSource: "device234",
        })
        .then(() => {
          mock.done();
        });
    });
  });

  describe("unsubscribe method", () => {
    it("makes the right request", () => {
      const mock = nock("http://fake.local")
        .delete("/ari/applications/foo/subscription")
        .query({ eventSource: "device234" })
        .reply(200, { foo: "bar" });

      const api = new ApplicationsAPI({
        baseUrl: "http://fake.local/ari",
        username: "foo",
        password: "bar",
      });

      return api
        .unsubscribe({
          applicationName: "foo",
          eventSource: "device234",
        })
        .then(() => {
          mock.done();
        });
    });
  });

  describe("filterEvents method", () => {
    it("makes the right request", () => {
      const mock = nock("http://fake.local")
        .put("/ari/applications/foo/eventFilter", {
          filter: {
            allowed: [{ type: "StasisStart" }],
            disallowed: [{ type: "StasisEnd" }],
          },
        })
        .reply(200, { foo: "bar" });

      const api = new ApplicationsAPI({
        baseUrl: "http://fake.local/ari",
        username: "foo",
        password: "bar",
      });

      return api
        .filterEvents({
          applicationName: "foo",
          filter: {
            allowed: [{ type: "StasisStart" }],
            disallowed: [{ type: "StasisEnd" }],
          },
        })
        .then(() => {
          mock.done();
        });
    });
  });
});
