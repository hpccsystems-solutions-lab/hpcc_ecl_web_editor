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
    const jsonResult = await res.json();

    return jsonResult;
  }
}

export default Comms;
