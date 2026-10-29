// src/utils/comms.js
class Comms {
  static async postAPIData(action, params = {}) {
    let url = "/api/" + action;
    let headers = new Headers();
    headers.set("Content-Type", "application/json");
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const body = await res.text();
      let message = `Request failed (HTTP ${res.status})`;
      try {
        const error = JSON.parse(body);
        message = error.message || error.error || message;
      } catch {
        // A proxy failure may return HTML or plain text rather than API JSON.
      }
      throw new Error(message);
    }

    const jsonResult = await res.json();

    return jsonResult;
  }
}

export default Comms;
