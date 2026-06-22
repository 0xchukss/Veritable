const url = "https://router-api-testnet.integratenetwork.work/v1/chat/completions";
const apiKey = "sk-113c8a4a-411d-41d9-90e7-a0e571a7e61e";

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: "qwen/qwen2.5-omni-7b",
    messages: [{ role: "user", content: "Tell me a short joke about 0G." }]
  })
}).then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
