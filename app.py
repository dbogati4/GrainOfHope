from flask import Flask, render_template, request, jsonify
import asyncio
from rag_bot_module import HungerRAGBot

app = Flask(__name__)
bot = HungerRAGBot()
asyncio.run(bot.update_knowledge_base())

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    question = data.get("question")
    answer = bot.chat(question)
    return jsonify(answer)

if __name__ == "__main__":
    app.run(debug=True)
