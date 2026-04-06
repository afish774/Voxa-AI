async function testGemini() {
    console.log("⏳ Sending message to Voxa API...");

    try {
        const response = await fetch("http://localhost:5000/api/chat/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: "Hello! Who are you and what can you do? Keep it to one sentence." })
        });

        const data = await response.json();
        console.log("✅ API Response:");
        console.log(data);
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

testGemini();